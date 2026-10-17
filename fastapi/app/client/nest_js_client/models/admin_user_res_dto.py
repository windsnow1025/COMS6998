from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field
from dateutil.parser import isoparse

from ..models.admin_user_res_dto_roles_type_0_item import AdminUserResDtoRolesType0Item

T = TypeVar("T", bound="AdminUserResDto")


@_attrs_define
class AdminUserResDto:
    """
    Attributes:
        roles (list[AdminUserResDtoRolesType0Item] | None):
        last_active_at (datetime.datetime | None):
        id (float):
        username (str):
        email (str):
        created_at (datetime.datetime):
        photos (float):
        photos_judged (float):
    """

    roles: list[AdminUserResDtoRolesType0Item] | None
    last_active_at: datetime.datetime | None
    id: float
    username: str
    email: str
    created_at: datetime.datetime
    photos: float
    photos_judged: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        roles: list[str] | None
        if isinstance(self.roles, list):
            roles = []
            for roles_type_0_item_data in self.roles:
                roles_type_0_item = roles_type_0_item_data.value
                roles.append(roles_type_0_item)

        else:
            roles = self.roles

        last_active_at: None | str
        if isinstance(self.last_active_at, datetime.datetime):
            last_active_at = self.last_active_at.isoformat()
        else:
            last_active_at = self.last_active_at

        id = self.id

        username = self.username

        email = self.email

        created_at = self.created_at.isoformat()

        photos = self.photos

        photos_judged = self.photos_judged

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "roles": roles,
                "lastActiveAt": last_active_at,
                "id": id,
                "username": username,
                "email": email,
                "createdAt": created_at,
                "photos": photos,
                "photosJudged": photos_judged,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)

        def _parse_roles(data: object) -> list[AdminUserResDtoRolesType0Item] | None:
            if data is None:
                return data
            try:
                if not isinstance(data, list):
                    raise TypeError()
                roles_type_0 = []
                _roles_type_0 = data
                for roles_type_0_item_data in _roles_type_0:
                    roles_type_0_item = AdminUserResDtoRolesType0Item(roles_type_0_item_data)

                    roles_type_0.append(roles_type_0_item)

                return roles_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(list[AdminUserResDtoRolesType0Item] | None, data)

        roles = _parse_roles(d.pop("roles"))

        def _parse_last_active_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_active_at_type_0 = isoparse(data)

                return last_active_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        last_active_at = _parse_last_active_at(d.pop("lastActiveAt"))

        id = d.pop("id")

        username = d.pop("username")

        email = d.pop("email")

        created_at = isoparse(d.pop("createdAt"))

        photos = d.pop("photos")

        photos_judged = d.pop("photosJudged")

        admin_user_res_dto = cls(
            roles=roles,
            last_active_at=last_active_at,
            id=id,
            username=username,
            email=email,
            created_at=created_at,
            photos=photos,
            photos_judged=photos_judged,
        )

        admin_user_res_dto.additional_properties = d
        return admin_user_res_dto

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
