from pydantic import BaseModel


class BaseReq(BaseModel):
    """Request base: bo qua truong khong khai bao (contract cho phep)."""

    model_config = {"extra": "ignore"}
