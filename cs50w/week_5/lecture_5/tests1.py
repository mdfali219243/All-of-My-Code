import unittest

from prime import is_prime  

class Tests(unittest.TestCase):
    def test_1(self):
        """ Check that 1 is not prime """
        self.assertFalse(is_prime(1))

    def test_2(self):
        """ Check that 2 is prime """
        self.assertTrue(is_prime(2))

    def test_3(self):
        """ Check that 3 is prime """
        self.assertTrue(is_prime(3))

    def test_4(self):
        """ Check that 4 is not prime """
        self.assertFalse(is_prime(4))

    def test_5(self):
        """ Check that 5 is prime """
        self.assertTrue(is_prime(5))

    def test_6(self):
        """ Check that 6 is not prime """
        self.assertFalse(is_prime(6))

    def test_7(self):
        """ Check that 7 is prime """
        self.assertTrue(is_prime(7))

    def test_8(self):
        """ Check that 8 is not prime """
        self.assertFalse(is_prime(8))

    def test_9(self):
        """ Check that 9 is not prime """
        self.assertFalse(is_prime(9))
        
    def test_10(self):
        """ Check that 10 is not prime """
        self.assertFalse(is_prime(10))
        
    def test_11(self):
        """ Check that 11 is prime """
        self.assertTrue(is_prime(11))
        
    def test_12(self):
        """ Check that 12 is not prime """
        self.assertFalse(is_prime(12))
        
    def test_13(self):
        """ Check that 13 is prime """
        self.assertTrue(is_prime(13))
            
    def test_14(self):
        """ Check that 14 is not prime """
        self.assertFalse(is_prime(14))
            
    def test_15(self):
        """ Check that 15 is not prime """
        self.assertFalse(is_prime(15))
            
    def test_16(self):
        """ Check that 16 is not prime """
        self.assertFalse(is_prime(16))
            
    def test_17(self):
        """ Check that 17 is prime """
        self.assertTrue(is_prime(17))
            
    def test_18(self):
        """ Check that 18 is not prime """
        self.assertFalse(is_prime(18))
            
    def test_19(self):
        """ Check that 19 is prime """
        self.assertTrue(is_prime(19))
            
    def test_20(self):
        """ Check that 20 is not prime """
        self.assertFalse(is_prime(20))
            
if __name__ == "__main__":
    unittest.main()