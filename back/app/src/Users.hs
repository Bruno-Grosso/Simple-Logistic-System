{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE TypeOperators #-}

module Users
  ( User (..),
    UsersAPI,
  )
where

import Data.Aeson (FromJSON, ToJSON)
import GHC.Generics (Generic)
import Servant

type UsersAPI = "users" :> Get '[JSON] [User]

data User = User
  { name :: String,
    password :: String,
    address :: String,
    role :: String -- Change to a sum type latter
  }
  deriving (Show, Generic)

instance ToJSON User

instance FromJSON User
