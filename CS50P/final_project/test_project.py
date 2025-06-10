from project import check_date, write_record, read_records, record_exists, get_record_count
from datetime import date
import pytest

def test_check_date():
    assert check_date("2023-10-01") == date(2023, 10, 1)
    with pytest.raises(ValueError):
        check_date("2024/10/12")

def test_write_record():
    write_record("test.csv", ["2023-10-01", "ABC123", 60])
    records = read_records("test.csv")
    assert records[-1] == ["2023-10-01", "ABC123", "60"]

def test_read_records():
    records = read_records("test.csv")
    assert len(records) > 0

def test_record_exists():
    assert record_exists("test.csv", "ABC123") == True
    assert record_exists("test.csv", "XYZ789") == False

def test_get_record_count():
    assert get_record_count("test.csv", "ABC123", date(2023, 10, 1)) == 2
    assert get_record_count("test.csv", "XYZ789", date(2023, 10, 1)) == 0
