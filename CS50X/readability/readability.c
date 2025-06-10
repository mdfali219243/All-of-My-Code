// we include our header file
#include <cs50.h>
#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

// those we define function
int count_letter(string text);
int count_word(string text);
int count_sentence(string text);

int main(void)
{
    // we ask user for the text
    string text = get_string("Text: ");

    // we are counting the letter
    int letters = count_letter(text);
    // we are counting the words
    int words = count_word(text);
    // we are counting the sentence
    int sentences = count_sentence(text);

    // we would check which gradelevel reading is it

    float L = ((float) letters / words) * 100;
    float S = ((float) sentences / words) * 100;
    float index = round(0.0588 * L - 0.296 * S - 15.8);
    if (index < 1)
    {
        printf("Before Grade 1\n");
    }
    else if (index >= 16)
    {
        printf("Grade 16+\n");
    }
    else
    {
        printf("Grade %i\n", (int) index);
    }
}

// we made our own counting letter function
int count_letter(string text)
{
    int letter = 0;
    for (int i = 0; i < strlen(text); i++)
    {
        if (isalpha(text[i]))
        {
            letter++;
        }
    }
    return letter;
}

// we made our own counting word function
int count_word(string text)
{
    int word = 0;
    for (int i = 0; i < strlen(text); i++)
    {
        if (i == 0 && !isspace(text[i]))
        {
            word++;
        }
        else if (!isspace(text[i]) && isspace(text[i - 1]))
        {
            word++;
        }
    }
    return word;
}

// sentence function
int count_sentence(string text)
{
    int sentence = 0;
    for (int i = 0; i < strlen(text); i++)
    {
        if ((text[i] == '.' || text[i] == '!' || text[i] == '?'))
        {
            sentence++;
        }
    }
    return sentence;
}
