from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.admin_vote_res_dto import AdminVoteResDto


T = TypeVar("T", bound="AdminVotePageResDto")


@_attrs_define
class AdminVotePageResDto:
    """
    Attributes:
        total (float):
        votes (list[AdminVoteResDto]):
    """

    total: float
    votes: list[AdminVoteResDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        total = self.total

        votes = []
        for votes_item_data in self.votes:
            votes_item = votes_item_data.to_dict()
            votes.append(votes_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "total": total,
                "votes": votes,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.admin_vote_res_dto import AdminVoteResDto

        d = dict(src_dict)
        total = d.pop("total")

        votes = []
        _votes = d.pop("votes")
        for votes_item_data in _votes:
            votes_item = AdminVoteResDto.from_dict(votes_item_data)

            votes.append(votes_item)

        admin_vote_page_res_dto = cls(
            total=total,
            votes=votes,
        )

        admin_vote_page_res_dto.additional_properties = d
        return admin_vote_page_res_dto

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
