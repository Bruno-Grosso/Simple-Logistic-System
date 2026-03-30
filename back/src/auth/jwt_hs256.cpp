#include "jwt_hs256.h"

#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/evp.h>
#include <openssl/hmac.h>

#include <array>

namespace logisys_jwt {

namespace {

auto base64url_encode(const unsigned char *data, std::size_t len) -> std::string {
    const auto b64 = BIO_new(BIO_f_base64());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    const auto mem = BIO_new(BIO_s_mem());
    const auto bio = BIO_push(b64, mem);
    BIO_write(bio, data, static_cast<int>(len));
    (void)BIO_flush(bio);
    BUF_MEM *buf_mem{};
    BIO_get_mem_ptr(bio, &buf_mem);
    std::string out(buf_mem->data, buf_mem->length);
    BIO_free_all(bio);
    for (auto &c : out) {
        if (c == '+')
            c = '-';
        else if (c == '/')
            c = '_';
    }
    while (!out.empty() && out.back() == '=')
        out.pop_back();
    return out;
}

auto b64url_json(std::string_view json) -> std::string {
    return base64url_encode(reinterpret_cast<const unsigned char *>(json.data()), json.size());
}

} // namespace

auto sign_hs256(const std::string_view secret, const std::string_view payload_json) -> std::string {
    static constexpr std::string_view hdr = R"({"alg":"HS256","typ":"JWT"})";

    const auto p1 = b64url_json(hdr);
    const auto p2 = b64url_json(payload_json);
    const std::string signing_input = std::string(p1) + "." + p2;

    std::array<unsigned char, EVP_MAX_MD_SIZE> digest{};
    unsigned int digest_len = 0;
    if (HMAC(EVP_sha256(), secret.data(), static_cast<int>(secret.size()),
             reinterpret_cast<const unsigned char *>(signing_input.data()),
             signing_input.size(), digest.data(), &digest_len) == nullptr) {
        return {};
    }

    const auto sig = base64url_encode(digest.data(), digest_len);
    return signing_input + "." + sig;
}

} // namespace logisys_jwt
