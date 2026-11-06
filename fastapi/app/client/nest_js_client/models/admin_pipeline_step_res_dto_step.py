from enum import Enum


class AdminPipelineStepResDtoStep(str, Enum):
    DESCRIBE = "describe"
    SCREEN = "screen"

    def __str__(self) -> str:
        return str(self.value)
