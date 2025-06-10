from jar import Jar
import pytest

def test_init():
    jar = Jar()
    assert jar.capacity == 12
    assert jar.size == 0

def test_str():
    jar = Jar()
    assert str(jar) == ""
    jar.deposit(2)
    assert str(jar) == "🍪🍪"

def test_deposit():
    jar = Jar()
    jar.deposit(5)
    assert jar.size == 5
    assert str(jar) == "🍪🍪🍪🍪🍪"
    with pytest.raises(ValueError):
        jar.deposit(8)

def test_withdraw():
    jar = Jar()
    jar.deposit(6)
    jar.withdraw(2)
    assert jar.size == 4
    assert str(jar) == "🍪🍪🍪🍪"
    with pytest.raises(ValueError):
        jar.withdraw(5)
