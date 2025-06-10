from fuel import convert, gauge
import pytest

def test_gauge_full():
    assert gauge(convert("3/3")) == "F"
    assert gauge(convert("3/4")) == "75%"
    assert gauge(convert("0/4")) == "E"


def test_convert_string_valid():
    assert convert("3/4") == (75)
    assert convert("1/2") == (50)

def test_convert_string_invalid():
    with pytest.raises(ValueError):
        convert("three/four")
    with pytest.raises(ValueError):
        convert("1.5/3")
    with pytest.raises(ZeroDivisionError):
        convert("3/0")

