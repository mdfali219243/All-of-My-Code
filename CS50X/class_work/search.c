//we include our files
#include <cs50.h>
#include <stdio.h>

// we create our own data type.
typedef struct
{
    string name;
    int votes;
}
candidator;// name of the data type

int main(void)
{
    const int num_candidator = 3;
    candidator candidates[num_candidator];//we maked a our own array

    candidates[0].name = "Foysal";
    candidates[0].votes = 12;

    candidates[1].name = "Fahim";
    candidates[1].votes = 8;

    candidates[2].name = "Faria";
    candidates[2].votes = 3;

    //we need to find out the highest number of votes
    int highest_votes = 0;
    for (int i = 0; i < num_candidator; i++)
    {
        if(candidates[i].votes > highest_votes)
        {
            highest_votes = candidates[i].votes;
        }
    }
    printf("%i\n", highest_votes);

    for(int i = 0; i < num_candidator; i++)
    {
        if(candidates[i].votes == highest_votes)
        {
            printf("%s\n",candidates[i].name);
        }
    }
}
