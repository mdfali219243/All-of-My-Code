from numb3rs import validate
import pytest

def test_valid():
    assert validate("192.168.1.1") == True
    assert validate("255.255.255.255") == True

def test_invalid():
    assert validate("275.3.6.28") == False
    assert validate("192.168.1") == False
    assert validate("192.168.1.999") == False

