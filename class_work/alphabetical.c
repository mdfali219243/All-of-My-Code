#include <cs50.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    string phrase = get_string("Enter the Phrase: ");// we asking the user for the phrase
    for (int i = 0, length = strlen(phrase); i < length - 1; i++)
    {
        if (phrase[i] > phrase[i + 1])
        {
            printf("Not in Alphabetical order.\n");
            return 0;
        }
    }
    printf("Alphabetical order!\n");
}
