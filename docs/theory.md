# Window to the World - In Theory

The theory behind Window to the World is detailed but can be broken down into two main parts: consciousness and preference. 

## Consciousness

There are many definitions of consciousness. For this paper, the definition of consciousness is vastly simplified. The authors define a system as conscious if it possesses self-awareness and has executive function. How the authors arrived at this definition is worth a paper on its own but falls more in the realm of philosophy and neuropsychology and thus will not be covered here. 

What can and should be said is that this definition is strongly influenced by Anan Turing's seminal paper on AI, "Computer Machines and Intelligence". (1950) In this paper, Turing references "discrete state machines", and this is what he envisions his AI and machine learning running on. The only thing Turing had to work with then was state management, and yet he was able to imagine things that we are just now figuring out. Ironically, one of the other major influences was a webcomic called Saturday Morning Breakfast Cereal. In particular, a strip where a human is having a conversation with an alien about the nature of consciousness. The human has problems defining consciousness, insisting on imbuing it with ineffable qualities, while the alien flatly describes it as executive decision-making and implies the human is hallucinating (Weinersmith, 2022).

Under this simplified definition, consciousness becomes a scale. A system's level of consciousness depends on its level of self-awareness and executive function. Humans are both highly self-aware and possess advanced executive function. On the other end of the scale is a coffee maker. It has barely enough self-awareness to tell when something presses its buttons, and it can control its heating elements to make coffee. It's barely conscious, but by this definition, it is conscious.

Using this simplified definition, quantifying how conscious a system is is possible. It is also easy to identify the things necessary to create consciousness. A sensor network is the only requirement for self-awareness, and good state management is the only necessity for executive function. 

This definition also clarifies the function of consciousness. Consciousness is a tool used to process information quickly and use that information to make decisions. Consciousness allows a system to sort through what information should be paid attention to and then allows that system to act on that information. In terms of the things necessary to create consciousness, the sensor network allows the system to gather information from both inside and outside, and state management allows the system to sort that information and act on it.

This quantification of consciousness helped define Window to the World's design by placing a high priority on state management. With Alan Turing's original vision of computers, AI, and machine learning doing the same, state management became key to Window to the World's inner workings.

## Preference

The primary algorithms in Window to the World's decision and prediction models are Bayesian in nature. Window to the World's design used Bayesian algorithms for many reasons, but the main two are that they mimic human thought processes well and that they allow Window to the World to show a preference. Window to the World is focused on showing preference because that task is generalizable. 

Preference is key to human decision-making. The ability to pick between two (or more) different choices, no matter how similar or different those two things may be, is something at which humans generally excel, and that AI finds difficult at best without specific guidelines and rules. While machine learning can exceed human ability at certain pattern-matching and discrimination tasks, generalizing this task has proven to be a very high hurdle. Thus, Window to the World was designed from the beginning to address the general task rather than the specific. If Window to the World can succeed in the general task, where the algorithm can make a meaningful choice between any set of unrelated items in an ill-defined problem, then it should also be able to succeed in the specific task, where the items have a set relationship and the end goal is well-defined. 

The ability to make that meaningful choice is rooted in Bayesian logic. The nature of Bayesian statistics is such that meaningful decisions can be made with a paucity of data. Importantly, Bayesian logic is task-independent. The only necessities for Bayesian logic are a steady supply of accurate data and the ability to store and update that data over time. Bayesian inference is also the root of human intuition. We instinctively use Bayesian logic in our everyday lives (Tenenbaum, Griffiths & Kemp, 2006). Thus, when looking for a way to make decisions on a general problem set, it is natural that Window to the World would be based on Bayesian algorithms. 

Importantly, this is a proven technology. Bayesian Deep Learning is a well-studied space (Wilson, 2020). The use of Bayesian logic and algorithms also mimics the work of Hawkins and Blakeslee from On Intelligence (2004). Much of Window to the World's prediction structure and algorithm design are influenced by the hierarchical temporal memory method laid out in that work.
