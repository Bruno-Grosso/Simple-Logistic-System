module Main (main) where

import Network.Wai.Handler.Warp (run)

import Server

main :: IO ()
main = run 8081 app
