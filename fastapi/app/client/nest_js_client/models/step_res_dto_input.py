from enum import Enum


class StepResDtoInput(str, Enum):
    IMAGE = "image"
    TEXT = "text"

    def __str__(self) -> str:
        return str(self.value)
