#include <cs50.h>
#include <stdio.h>

int main(void)
// make a contract number
{
    string name = get_string("What's the name? ");
    int age = get_int("What is you age? ");
    string pn = get_string("what's is your phone numbers? ");

    printf("Nmae: %s\n", name);
    printf("Age: %i\n", age);
    printf("Phone Number: %s\n", pn);
}
