#pragma once

#include <string>
#include <string_view>

namespace logisys_jwt {

/** HS256 JWT. `payload_json` must be a single JSON object string, e.g. {"sub":"...","exp":123}. */
auto sign_hs256(std::string_view secret, std::string_view payload_json) -> std::string;

} // namespace logisys_jwt
