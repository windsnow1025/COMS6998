from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.email_verification_req_dto_purpose import EmailVerificationReqDtoPurpose

T = TypeVar("T", bound="EmailVerificationReqDto")


@_attrs_define
class EmailVerificationReqDto:
    """
    Attributes:
        email (str):
        purpose (EmailVerificationReqDtoPurpose):
    """

    email: str
    purpose: EmailVerificationReqDtoPurpose
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        email = self.email

        purpose = self.purpose.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "email": email,
                "purpose": purpose,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        email = d.pop("email")

        purpose = EmailVerificationReqDtoPurpose(d.pop("purpose"))

        email_verification_req_dto = cls(
            email=email,
            purpose=purpose,
        )

        email_verification_req_dto.additional_properties = d
        return email_verification_req_dto

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
