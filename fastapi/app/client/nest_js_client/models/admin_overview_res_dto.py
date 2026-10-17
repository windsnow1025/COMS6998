from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.admin_day_res_dto import AdminDayResDto
    from ..models.admin_llm_step_res_dto import AdminLlmStepResDto
    from ..models.admin_totals_res_dto import AdminTotalsResDto
    from ..models.admin_voice_res_dto import AdminVoiceResDto


T = TypeVar("T", bound="AdminOverviewResDto")


@_attrs_define
class AdminOverviewResDto:
    """
    Attributes:
        totals (AdminTotalsResDto):
        days (list[AdminDayResDto]):
        voices (list[AdminVoiceResDto]):
        llm_steps (list[AdminLlmStepResDto]):
    """

    totals: AdminTotalsResDto
    days: list[AdminDayResDto]
    voices: list[AdminVoiceResDto]
    llm_steps: list[AdminLlmStepResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        totals = self.totals.to_dict()

        days = []
        for days_item_data in self.days:
            days_item = days_item_data.to_dict()
            days.append(days_item)

        voices = []
        for voices_item_data in self.voices:
            voices_item = voices_item_data.to_dict()
            voices.append(voices_item)

        llm_steps = []
        for llm_steps_item_data in self.llm_steps:
            llm_steps_item = llm_steps_item_data.to_dict()
            llm_steps.append(llm_steps_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "totals": totals,
                "days": days,
                "voices": voices,
                "llmSteps": llm_steps,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_day_res_dto import AdminDayResDto
        from ..models.admin_llm_step_res_dto import AdminLlmStepResDto
        from ..models.admin_totals_res_dto import AdminTotalsResDto
        from ..models.admin_voice_res_dto import AdminVoiceResDto

        d = dict(src_dict)
        totals = AdminTotalsResDto.from_dict(d.pop("totals"))

        days = []
        _days = d.pop("days")
        for days_item_data in _days:
            days_item = AdminDayResDto.from_dict(days_item_data)

            days.append(days_item)

        voices = []
        _voices = d.pop("voices")
        for voices_item_data in _voices:
            voices_item = AdminVoiceResDto.from_dict(voices_item_data)

            voices.append(voices_item)

        llm_steps = []
        _llm_steps = d.pop("llmSteps")
        for llm_steps_item_data in _llm_steps:
            llm_steps_item = AdminLlmStepResDto.from_dict(llm_steps_item_data)

            llm_steps.append(llm_steps_item)

        admin_overview_res_dto = cls(
            totals=totals,
            days=days,
            voices=voices,
            llm_steps=llm_steps,
        )

        admin_overview_res_dto.additional_properties = d
        return admin_overview_res_dto

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
