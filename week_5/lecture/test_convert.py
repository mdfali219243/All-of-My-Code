import pytest
from convert import convert


def test_conversion():
    assert convert(1) == 149597870700
    assert convert(50) == (149597870700 * 50)

def test_error():
    with pytest.raises(TypeError):
        convert("1")

def test_float_convesion():
    assert convert(0.001) == pytest.approx(149597870.691, abs= 1e-2)
