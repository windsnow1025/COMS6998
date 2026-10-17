from enum import Enum


class AdminUserResDtoRolesType0Item(str, Enum):
    ADMIN = "admin"
    USER = "user"

    def __str__(self) -> str:
        return str(self.value)
