{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE FlexibleInstances #-}
{-# LANGUAGE GeneralizedNewtypeDeriving #-}
{-# LANGUAGE MultiParamTypeClasses #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RankNTypes #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TypeOperators #-}

module Server (
  app
) where

import Servant
import Users

userMockList :: [User]
userMockList =
  [ User "Some name" "pass123" "some place" "admin",
    User "Some name2" "clever_pass123" "some other place" "client"
  ]

server :: Server UsersAPI
server = return userMockList

userAPI :: Proxy UsersAPI
userAPI = Proxy

app :: Application
app = serve userAPI server
