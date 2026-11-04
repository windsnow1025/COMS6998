from enum import Enum


class RunSummaryResDtoOutputType(str, Enum):
    CAPTIONS = "captions"
    TEXT = "text"

    def __str__(self) -> str:
        return str(self.value)
