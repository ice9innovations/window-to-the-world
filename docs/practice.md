# In Practice

In practical terms, Window to the World's abilities are based on its architecture and data storage. Window to the World is an open-box system.

## Emergent Intelligence 

Window to the World's architecture is based on the idea of emergence. Emergent Intelligence is a concept from the study of complex systems. A complex system shows emergence when the system shows behavior that cannot be explained by the function of its parts alone. Flocking and swarming behavior is emergent, as are traffic jams. Window to the World's ability to make decisions emerges from the synergy of its parts working together, rather than any of the individual parts alone. Its architecture is built to take advantage of emergence.

## Cloud Native, Microservice Oriented Architecture 

<img src="https://user-images.githubusercontent.com/110870907/184448845-1e10980f-7e24-4f07-a4bf-6a3631f4208a.png" width="40%" align="right">

Window to the World consists of several parts:

* **Data Source** - The global pool of all the data that could potentially be fed into Window to the World
* **Data Stream** - The data that Window to the World is actively accessing or has previously accessed
* **Message Queue** - The parts of the data stream that Window to the World is currently working on are stored
* **Database** - where Window to the World stores information about the users and data stream. Depending on the implementation, there may also be a user interface. 

Data comes from the data source as part of a data stream. It enters the queue, where Window to the World processes it. Data about the data stream, as well as predictions from Window to the World and validation from the user, is stored in the database, and then the stream is emptied from the queue. Window to the World processes data through the use of multiple modules, or bots. 

### Bot-Based Architecture 

Window to the World's bots are all modular and are designed to run asynchronously. More about that in the implementation section. These modules are of various types: data analysis, decision, and cognitive. Data analysis modules consist of various models designed to analyze the data stream. This can be anything from simply determining the file type and size to other machine learning (ML) models (such as object detectors or other identification modules). The decision modules are designed to make decisions and predictions based on Window to the World's current knowledge, and the cognitive models are designed to categorize and store data about the user and file stream in the database to be used later by the decision models.

### Message Queue

Because of the way Window to the World handles data, it is essentially a giant queue. Data comes in one end, is processed, and comes out the other end. Because the data is processed by multiple bots all acting independently, this can create problems. This problem is solved through good state management. In this case, the solution is to make Window to the World function as a Turing machine, specifically a two-tape Turing machine. Each file that comes in is assigned to a particular cell on Tape 1. Once a cell on Tape 1 has been assigned, a second tape is created. Every tag that is created for that file is assigned to a cell on Tape 2. When the file has finished processing, Window to the World has all the data that is associated with that file in one place, Tape 2, and can cut it up so that it can be archived in the appropriate places. Turing's halting problem paper (1936), and a paper by Yurii Rogozhin on Turing machines (1999) proved extremely helpful in implementing this design.

This is how the algorithm works. When a file or source of data comes in, it goes through the various data analysis modules. Each of those models tags the file with the relevant information (say file size, entropy, color, or objects) and, if appropriate, the certainty. For other ML models, certainty is summed up across all the tags. For example, if a file comes in of a crowded street and the object detector puts 10 person tags on it, each with a 70% certainty, Window to the World adds one tag with a 700% certainty. 

### Tagging Bots

As each tag is added, a decision bot compares the tags on the file to the user's model. If a known-good or known-bad threshold is reached, a decision bot raises the file's priority in the queue or kicks it out entirely. There are three decision bots, two level 1 (L1) bots, and one level 2 (L2) bot. The L1 bots are designed to run against each other. One bot looks at known-good info, the other at known-bad. If a file doesn't reach a threshold to be kicked or promoted by the time all the data bots have run (or a timer runs out), each L1 bot makes a prediction. The known-good L1 bot predicts the likelihood that the user will interact positively with the file and vice versa. Once both L1 bots have made their predictions, the L2 bot runs. The L2 bot compares the L1 predictions against validated user actions and makes a final prediction. The L2 prediction is then validated (or not) by user action, and the results are stored in the database by the cognitive bot. Again, this two-level design and feedback structure echo Hawkins and Blakeslee's theories.

An example of the decision bots in action: A file comes in with some tags on it. The L1 bots each compare the raw tags on the file against the raw tags in the known-good and known-bad database. Assuming no threshold is met, each L1 bot makes a prediction based on the raw tags alone. Let's say this file has an 80% chance that the user likes it and a 40% chance that the user doesn't. The L1 bots each add a tag with that prediction. The L2 bot then looks at the L1 prediction tags and compares those tags to a database of L1 predictions and user actions. For this example in cases where the L1 bots have made an 80%/40% prediction, the user has validated the good prediction 75% of the time. The L2 bot then adds that tag to the file and sends it off to be validated. For this example, the user does not like the file, and thus the L2 prediction was incorrect. This validation feeds back to the L2 bot, which updates the database for future predictions.

### Cognitive Bots 

The cognitive bots run throughout the process and, like data analysis bots, also add tags to the file that help with decision-making. However, cognitive bots do much more than provide single data points and are thus categorized differently. The cognitive bots help categorize and store the data received from the other models. More on how this data is categorized and stored in the next section. 

### Thinking Fast AND Slow

Daniel Kahneman's Thinking, Fast and Slow (2011) influenced the design of the cognitive bots and data storage models. Kahneman's book distinguishes between the "experiencing self" and "remembering self" where the "experiencing self" exists in immediate, short-term memory, and the "remembering self" exists in long-term memory. This distinction is important because most conscious decisions are made by the "remembering self". 

These two selves are mirrored in Window to the World's architecture. When Window to the World processes a file, it does so by running it through various data analyses and decision modules. Its experiencing self is concerned with tagging the file and deciding how to handle it in the queue. Window to the World's remembering self is mirrored by the data storage system. Once the file is moved through the queue, data from that file is processed by the cognitive modules and stored in cognitive maps and categorization trees. 

Thus Window to the World's "experience" of the file and its "memory" of the file is very different, same as a human's experience and memory are different. Furthermore, they are different for the same reason. Both have experiences that are concerned with processing the information as it comes in, whereas memory is concerned with sorting and making sense of it for long-term storage and later use.

## Data Storage

Much of Window to the World's ability to process data efficiently comes from the way that data is stored. Window to the World stores data in two main ways: cognitive maps and categorization trees. While this model was created before doing any research, a paper by Popham et al. in Nature Neuroscience (2021) provided excellent confirmation that this strategy was not only valid but also mirrored data storage strategies used by biology.

## Cognitive Maps

Cognitive maps are a way to store data that allows Window to the World to make associations between data points. The cognitive map stores each data point individually but builds links between data points as more data is validated. When a validated file comes in, Window to the World looks at all the data points on that file. Window to the World then goes to that user's cognitive map and does several things. First, a new record is added to each data point recording it was attached to that particular file. Then, Window to the World links all the data points on that file to all the other data points on that file, using either certainty or increments for the weight of that connection. 

This creates a literal map of how both tags and files are connected. Window to the World can look down into a tag to see all the files that the user has validated that had that tag, or across the map to see how tags are connected. It also enables Window to the World to do things like check the connection strength between a given set of tags or run nearest neighbor searches. It also creates a nice visualization for a human to search, should they be so inclined. This adds to the "open box" nature of Window to the World's system.

In theory, there is only one cognitive map that connects all data across all users, it is useful to break the map up. Breaking it up by user is the most natural way to do it, as that enables decision-making against a particular user's preferences, but searches against global preferences can also be useful, depending on the need. 

## Categorization Trees

While cognitive maps can be built with raw tag data and nothing else, categorization trees require a bit more processing but are equally more useful. If a cognitive map looks at how tags are related to each other with raw data alone, categorization trees look at how tags are related through meta-data. A categorization tree categorizes tags and collects them in trees. For example, a categorization tree might consist of Animals at the top layer, then Dogs and Cats in the middle layer, then Golden Retrievers, Boxers, Housecats, and Big Cats at the bottom layer. 

This allows Window to the World to make more intelligent choices when thinking about a user's preferences. For example, if a user has been marking a lot of dogs as good and a picture is tagged with a Golden Retriever, Window to the World can recognize that as a Dog and promote it. It also allows for lateral movement. If a user has been marking a lot of Golden Retrievers as good, and a picture of a Boxer comes up, Window to the World can recognize both of these as Dogs and choose to promote the Boxer picture. 

## Open-Box System

An interesting result of Window to the World's architecture is that its system is visible. The system is visible by default because the bots need to talk to each other. While some bots can work independently, many bots require access to data the other bots provide. The decision and cognitive bots need access to the tags provided by the data analysis modules, and the data analysis modules need access to the data stream. With all the modules talking to each other and adding information to the files, it would be significantly harder to make Window to the World a closed system rather than an open one. 

Having an open system offers several advantages. An open system is easier to troubleshoot, both from an IT perspective and an ML perspective. If something breaks or the model isn't doing what it should it is easy to look inside and see why. All of the tags and certainties are visible, all of the calls are visible, and it is possible to watch the system running in real-time. 

Having an open system also means there is no confusion about what Window to the World is doing. There is no need to guess why the system categorized something in a particular way. It is possible to go in and dissect why a file was handled the way it was, and if something was off, manually change how the system handles it. Besides the fact that it is similar to human decision-making, the fact that it is easy to bias is another reason Window to the World uses Bayesian algorithms. 

With an open, modular architecture, intelligent data storage strategies, Bayesian algorithms, and a priority on state management, Window to the World represent a new kind of AI. These changes create a data-agnostic system that can make meaningful decisions about anything it can analyze. 

## Architecture Diagram

![window-to-the-world-architecture-diagram](https://user-images.githubusercontent.com/110870907/184440199-c595eb7d-ed81-44d5-8484-5b77a73e8694.jpg)
