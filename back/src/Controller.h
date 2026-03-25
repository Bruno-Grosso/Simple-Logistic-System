//
// Created by be on 3/25/26.
//

#ifndef SIMPLELOGISTICSSYSTEM_CONTROLLER_H
#define SIMPLELOGISTICSSYSTEM_CONTROLLER_H

class Controller {
public:
    /**
     * @brief Initiates the app's routes
     */
    static auto init() -> void;

    /**
     * @brief Opens port 8848 to listen
     */
    static auto run() -> void;
};


#endif //SIMPLELOGISTICSSYSTEM_CONTROLLER_H
