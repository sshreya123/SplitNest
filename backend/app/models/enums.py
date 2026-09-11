from enum import Enum


class GroupRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"
class SplitType(str, Enum):
    EQUAL = "equal"
    EXACT = "exact"
    PERCENTAGE = "percentage"