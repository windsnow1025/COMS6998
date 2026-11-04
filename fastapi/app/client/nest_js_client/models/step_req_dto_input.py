from enum import Enum


class StepReqDtoInput(str, Enum):
    IMAGE = "image"
    TEXT = "text"

    def __str__(self) -> str:
        return str(self.value)
