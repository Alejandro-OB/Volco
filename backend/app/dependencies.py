from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from typing import Annotated


oauth2_scheme = OAuth2PasswordBearer("/token/")

TokenDep = Annotated[str, Depends(oauth2_scheme)]

