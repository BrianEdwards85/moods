from datetime import datetime

from ariadne import ScalarType

datetime_scalar = ScalarType("DateTime")
json_scalar = ScalarType("JSON")


@datetime_scalar.serializer
def serialize_datetime(value: datetime) -> str:
    return value.isoformat()


@datetime_scalar.value_parser
def parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value)


@json_scalar.serializer
def serialize_json(value):
    return value


@json_scalar.value_parser
def parse_json(value):
    return value
