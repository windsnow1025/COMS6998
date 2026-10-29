from enum import Enum


class AdminConfigControllerFindLlmCallsStep(str, Enum):
    CAPTION = "caption"
    DESCRIBE = "describe"

    def __str__(self) -> str:
        return str(self.value)
