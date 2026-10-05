from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.flavor_stat_res_dto import FlavorStatResDto


T = TypeVar("T", bound="StatsResDto")


@_attrs_define
class StatsResDto:
    """
    Attributes:
        streak (float):
        votes (float):
        judged (float):
        matches (float):
        flavors (list[FlavorStatResDto]):
        photos (float):
        picks_received (float):
        roasts_left (float):
    """

    streak: float
    votes: float
    judged: float
    matches: float
    flavors: list[FlavorStatResDto]
    photos: float
    picks_received: float
    roasts_left: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        streak = self.streak

        votes = self.votes

        judged = self.judged

        matches = self.matches

        flavors = []
        for flavors_item_data in self.flavors:
            flavors_item = flavors_item_data.to_dict()
            flavors.append(flavors_item)

        photos = self.photos

        picks_received = self.picks_received

        roasts_left = self.roasts_left

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "streak": streak,
                "votes": votes,
                "judged": judged,
                "matches": matches,
                "flavors": flavors,
                "photos": photos,
                "picksReceived": picks_received,
                "roastsLeft": roasts_left,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        from ..models.flavor_stat_res_dto import FlavorStatResDto

        d = dict(src_dict)
        streak = d.pop("streak")

        votes = d.pop("votes")

        judged = d.pop("judged")

        matches = d.pop("matches")

        flavors = []
        _flavors = d.pop("flavors")
        for flavors_item_data in _flavors:
            flavors_item = FlavorStatResDto.from_dict(flavors_item_data)

            flavors.append(flavors_item)

        photos = d.pop("photos")

        picks_received = d.pop("picksReceived")

        roasts_left = d.pop("roastsLeft")

        stats_res_dto = cls(
            streak=streak,
            votes=votes,
            judged=judged,
            matches=matches,
            flavors=flavors,
            photos=photos,
            picks_received=picks_received,
            roasts_left=roasts_left,
        )

        stats_res_dto.additional_properties = d
        return stats_res_dto

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
