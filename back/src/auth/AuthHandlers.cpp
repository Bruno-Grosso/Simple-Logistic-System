#include "auth/AuthHandlers.h"

#include <cctype>
#include <cstdlib>
#include <ctime>
#include <iomanip>
#include <sstream>

#include <json/writer.h>
#include <openssl/rand.h>

#include "App.h"
#include "auth/jwt_hs256.h"

using namespace drogon;

namespace {

auto json_fail(std::function<void(const HttpResponsePtr &)> &callback,
               const int code, const char *msg) -> void {
    Json::Value j;
    j["ok"] = false;
    j["success"] = false;
    j["error"] = msg;
    const auto r = HttpResponse::newHttpJsonResponse(j);
    r->setStatusCode(static_cast<HttpStatusCode>(code));
    callback(r);
}

} // namespace

auto AuthHandlers::login(const HttpRequestPtr &req,
                         std::function<void(const HttpResponsePtr &)> &&callback) -> void {
    const auto json = req->getJsonObject();
    if (!json) {
        json_fail(callback, 400, "Expected JSON body");
        return;
    }
    if (!(*json).isMember("email") || !(*json).isMember("password")) {
        json_fail(callback, 400, "Missing email or password");
        return;
    }

    std::string email = (*json)["email"].asString();
    const std::string password = (*json)["password"].asString();

    while (!email.empty() && std::isspace(static_cast<unsigned char>(email.front())))
        email.erase(email.begin());
    while (!email.empty() && std::isspace(static_cast<unsigned char>(email.back())))
        email.pop_back();
    for (auto &c : email)
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));

    if (email.empty() || email.size() > 254 || email.find('@') == std::string::npos) {
        json_fail(callback, 400, "Invalid email");
        return;
    }

    const auto row = QueryProcessor::fetchUserForAuth(email);
    if (!row || (*row)["password"].asString() != password) {
        json_fail(callback, 401, "Invalid credentials");
        return;
    }

    const std::string user_id = (*row)["id"].asString();
    const std::string role = (*row)["role"].asString();

    unsigned char rand_bytes[16];
    if (RAND_bytes(rand_bytes, sizeof rand_bytes) != 1) {
        json_fail(callback, 500, "Could not create session");
        return;
    }
    static constexpr char k_hex[] = "0123456789abcdef";
    std::string session_id;
    session_id.reserve(32);
    for (const unsigned char b : rand_bytes) {
        session_id.push_back(k_hex[b >> 4U]);
        session_id.push_back(k_hex[b & 15U]);
    }

    const auto t = std::time(nullptr);
    std::tm tm_buf{};
    gmtime_r(&t, &tm_buf);
    std::ostringstream ts;
    ts << std::put_time(&tm_buf, "%Y-%m-%d %H:%M:%S");
    const std::string ts_str = ts.str();

    const auto insert_sql =
        App::qp.getQuery(QueryProcessor::createOnlineUser(session_id, user_id, ts_str, ts_str));
    if (!QueryProcessor::runSqlNoResult(insert_sql)) {
        json_fail(callback, 500, "Could not record session");
        return;
    }

    const bool remember = (*json).isMember("remember_me") && (*json)["remember_me"].asBool();
    const std::int64_t exp =
        static_cast<std::int64_t>(t) + (remember ? 60LL * 60 * 24 * 30 : 60LL * 60 * 24 * 7);

    Json::Value pl;
    pl["sub"] = user_id;
    pl["role"] = role;
    pl["sid"] = session_id;
    pl["exp"] = static_cast<Json::Int64>(exp);

    Json::StreamWriterBuilder wb;
    wb["emitUTF8"] = true;
    wb["indentation"] = "";
    std::string payload_json = Json::writeString(wb, pl);
    while (!payload_json.empty() && (payload_json.back() == '\n' || payload_json.back() == '\r'))
        payload_json.pop_back();

    const char *sec_env = std::getenv("LOGISYS_JWT_SECRET");
    const std::string secret = (sec_env != nullptr && sec_env[0] != '\0')
                                   ? std::string(sec_env)
                                   : std::string("dev-only-jwt-secret-change-in-production-32");

    const std::string jwt = logisys_jwt::sign_hs256(secret, payload_json);
    if (jwt.empty()) {
        json_fail(callback, 500, "Could not sign token");
        return;
    }

    Json::Value okj;
    okj["ok"] = true;
    okj["success"] = true;
    okj["token"] = jwt;
    callback(HttpResponse::newHttpJsonResponse(okj));
}

auto AuthHandlers::registerUser(const HttpRequestPtr &req,
                                std::function<void(const HttpResponsePtr &)> &&callback) -> void {
    const auto json = req->getJsonObject();
    if (!json || !(*json).isMember("id") || !(*json).isMember("name") ||
        !(*json).isMember("email") || !(*json).isMember("password") ||
        !(*json).isMember("address") || !(*json).isMember("role")) {
        json_fail(callback, 400, "Missing required fields: id, name, email, password, address, role");
        return;
    }
    QueryProcessor::executeQuery(
        QueryProcessor::createUser((*json)["id"].asString(), (*json)["name"].asString(),
                                   (*json)["email"].asString(), (*json)["password"].asString(),
                                   (*json)["address"].asString(), (*json)["role"].asString()),
        std::move(callback));
}
