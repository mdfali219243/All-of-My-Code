// we include all the header files we need
#include <cs50.h>
#include <ctype.h>
#include <stdio.h>
#include <string.h>

// we made gobal vriable.
int point[26] = {1, 3, 3, 2, 1, 4, 2, 4, 1, 8, 5, 1, 3, 1, 1, 3, 10, 1, 1, 1, 1, 4, 4, 8, 4, 10};

int compute_score(string word);

int main(void)
{
    // prompt for the user for two words
    string word1 = get_string("Player 1: ");
    string word2 = get_string("Player 2: ");

    // compute the score of each word
    int score1 = compute_score(word1);
    int score2 = compute_score(word2);
    // we are decaring the winner by the score
    if (score1 > score2)
    {
        printf("Player 1 wins!\n");
    }
    else if (score2 > score1)
    {
        printf("Player 2 wins!\n");
    }
    else
    {
        printf("Tie!\n");
    }
}

// we would make our own function to compute the score and return the value
int compute_score(string word)
{
    int score = 0; // we are tracking our score
    for (int i = 0, length = strlen(word); i < length; i++)
    {
        if (isupper(word[i]))
        {
            score += point[word[i] - 'A'];
        }
        else if (islower(word[i]))
        {
            score += point[word[i] - 'a'];
        }
    }
    return score; // it would return the total score
}
