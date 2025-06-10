#include <cs50.h>
#include <stdio.h>

int main(void)
{
    char *s = "Hi!";
    printf("%c", *s);
    printf("%c", *(s + 1));
    printf("%c\n", *(s + 2));
}
