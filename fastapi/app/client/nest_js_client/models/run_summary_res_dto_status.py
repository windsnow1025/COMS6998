from enum import Enum


class RunSummaryResDtoStatus(str, Enum):
    FAILED = "failed"
    RUNNING = "running"
    SUCCEEDED = "succeeded"

    def __str__(self) -> str:
        return str(self.value)
