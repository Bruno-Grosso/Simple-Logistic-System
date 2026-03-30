#pragma once

#include <functional>
#include <drogon/HttpRequest.h>
#include <drogon/HttpResponse.h>

class AuthHandlers {
public:
    /** POST /login — validates credentials, inserts online_users row, returns HS256 JWT. */
    static auto login(const drogon::HttpRequestPtr &req,
                      std::function<void(const drogon::HttpResponsePtr &)> &&callback) -> void;

    /** POST /clients — creates a new user row (admin-style registration). */
    static auto registerUser(const drogon::HttpRequestPtr &req,
                             std::function<void(const drogon::HttpResponsePtr &)> &&callback) -> void;
};
