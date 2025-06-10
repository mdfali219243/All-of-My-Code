// Implements a dictionary's functionality
#include "dictionary.h"
#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>

// Represents a node in a hash table
typedef struct node
{
    char word[LENGTH + 1];
    struct node *next;
} node;

// TODO: Choose number of buckets in hash table
const unsigned int N = 26;

// Hash table
node *table[N];

// Returns true if word is in dictionary, else false
bool check(const char *word)
{
    // TODO
    int index = hash(word);
    node *tmp = table[index];
    while (tmp != NULL)
    {
        if (strcasecmp(tmp->word, word) == 0)
        {
            return true;
        }
        else
            tmp = tmp->next;
    }
    return false;
}

// Hashes word to a number
unsigned int hash(const char *word)
{
    // TODO: Improve this hash function
    unsigned int total = 0;                // first we make sure our input is positive
    for (int i = 0; i < strlen(word); i++) // we go throught every word
    {
        total += toupper(word[i]) - 'A';
    }
    return total % N;
}

// Loads dictionary into memory, returning true if successful, else false
bool load(const char *dictionary)
{
    // TODO
    // open the file
    FILE *source = fopen(dictionary, "r");
    if (source == NULL)
    {
        return 1;
    }
    char buffer[LENGTH + 1];
    while (fscanf(source, "%s", buffer) != EOF)
    {
        node *n = malloc(sizeof(node));
        if (n == NULL)
        {
            return 1;
        }
        strcpy(n->word, buffer);
        int index = hash(n->word);
        n->next = table[index];
        table[index] = n;
    }
    fclose(source);
    return true;
}

// Returns number of words in dictionary if loaded, else 0 if not yet loaded
unsigned int size(void)
{
    // TODO
    unsigned int counter = 0;
    for (int i = 0; i < N; i++)
    {
        node *ptr = table[i];

        while (ptr != NULL)
        {
            ptr = ptr->next;
            counter++;
        }
    }
    return counter;
}

// Unloads dictionary from memory, returning true if successful, else false
bool unload(void)
{
    // TODO
    for (int i = 0; i < N; i++)
    {
        node *ptr = table[i];
        while (ptr != NULL)
        {
            node *tmp = ptr;
            ptr = ptr->next;
            free(tmp);
        }
    }
    return true;
}
