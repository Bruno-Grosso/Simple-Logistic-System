//
// Created by be on 3/20/26.
//

#include "App.h"

auto main() -> int {
    App::init();
    App::run();
    App::cleanup();

    return EXIT_SUCCESS;
}