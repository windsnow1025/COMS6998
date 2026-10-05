from enum import Enum


class ImagesControllerFindTopRange(str, Enum):
    ALL = "all"
    WEEK = "week"

    def __str__(self) -> str:
        return str(self.value)
