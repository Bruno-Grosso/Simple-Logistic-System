//
// Created by be on 3/20/26.
//

#include <benchmark/benchmark.h>

// A super simple benchmark
static void BM_OnePlusOne(benchmark::State& state) {
    for (auto _ : state) {
        benchmark::DoNotOptimize(1 + 1);
    }
}

BENCHMARK(BM_OnePlusOne);

// Required main
BENCHMARK_MAIN();