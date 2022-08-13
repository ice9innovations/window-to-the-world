# References

Turing, A. M. (1950). I. Computing Machinery and Intelligence | Mind | Oxford Academic: Vol. LIX (Issue 236, pp. 433–460). Oxford Academic. https://doi.org/https://doi.org/10.1093/mind/LIX.236.433

---

Hawkins, J., & Blakeslee, S. (2004). On Intelligence. Times Books. https://doi.org/10.1604/9780805074567

On Intelligence guided Window to the World's overall architecture and use of Bayesian algorithms. In this book, Hawkins and Blakeslee discuss how the architecture of a computer and the human brain differs. Hawkins asserts that intelligence emerges from the multi-layered structure of the cerebral cortex, and its ability to make dynamic predictions. 

Hawkins et al also describe hierarchical temporal memory. Predictions start at the lower levels of the brain and work their way up. At each stage, these predictions are either validated as correct or reevaluated. If the lower level prediction needs to be reevaluated, then the higher level makes a new prediction, which is passed up instead. Corrected predictions from the higher levels are passed back down to the lower levels as feedback and learning.

Memory is the basis of this system. Predictions are based on association. What has happened in the past informs what the brain thinks will happen in the future. This is how predictions change. When new memories are made, predictions made from those memories change as well. 

Window to the world's multi-tiered structure, with two levels of predictions and validations, and its Bayesian algorithms, where past occurrences inform future probabilities, are strongly inspired by Hawkin's work.

---

Baan, J. (2021, March 2). A Comprehensive Introduction to Bayesian Deep Learning - Joris Baan. Joris Baan; jorisbaan.nl. https://jorisbaan.nl/2021/03/02/introduction-to-bayesian-deep-learning.html

Wilson, A. G. (2020). The Case for Bayesian Deep Learning (Vol. 2001, Issue 10995). arXiv.

This article and the paper it cited provided deep insights into exactly how Window to the World's Bayesian algorithms should be implemented. Since neither of the authors has any formal training in AI, it was necessary to understand how exactly Bayesian logic can be implemented in that space. This article provided the much-needed context in this area.

More importantly, this article provided the specific points that needed to be emphasized to achieve the design goal of generalization. While Window to the World is not a traditional neural network, understanding that marginalization was the main focus and that inductive biases are key to generalization helped shape its implementation.

---

Rogozhin, Y. (1999). Small universal Turing machines - ScienceDirect (Vol. 168, Issue 2, pp. 215–240). www.sciencedirect.com.

While Turing's work provided indirect inspiration for Window to the World's implementation, direct inspiration was taken from this Rogozhin's paper. Window to the World's internal function is identical to a multi-tape Turing machine modeled after the ones in this paper.

--- 

Russakof, D. B., Tomasi, C., Rohlfing, T., & Maurer, Calvin R. (2004). Image Similarity Using Mutual Information Regions

Window to the World's implementation relies on image recognition. 

---

Fu, C., Chen, J., Zou, H., Meng, W., Zhan, Y., & Yu, Y. (2012). A chaos-based digital image encryption scheme with an improved diffusion strategy (Vol. 20, Issue 3, pp. 2363–2378).

This paper acts as a proof of concept and informs much of the work done when implementing the image-based authentication system used in Window to the World.

---

Popham, S. F., Huth, A. G., Bilenko, N. Y., Deniz, F., Gao, J. S., Nunez-Elizalde, A. O., & Gallant, J. L. (2021). Visual and linguistic semantic representations are aligned at the border of human visual cortex - Nature Neuroscience (Vol. 24, Issue 11, pp. 1628–1636). www.nature.com. https://doi.org/https://doi.org/10.1038/s41593-021-00921-6

Window to the World stores data in a way that makes understanding relationships between various tags easy. Data is stored both conceptually, with trees providing structure between various concepts, and relationally, with each tag linked with every other tag on the same file.

This cross-categorization mimics the structure that researchers found in the brain. Semantic links are connected to concept structures and vice versa. With the brain, this structure is created using links between the language and visual cortex. In Window to the World, links are created between categorization trees and cognitive maps.

---

Kahneman, D. (2011). Thinking, fast and slow. Farrar, Straus and Giroux.

In Thinking, fast and slow, Kahneman distinguishes between the "experiencing self" and the "remembering self". The "experiencing self" exists in the present, a span of about three seconds where the brain unifies all of the sensory data it constantly collects into short-term memory. The experiencing self is reactionary, acting only on instinct, without any ability to reflect. The "remembering self" is the recollection of past events as memories. Remembering is reflective, where previous experiences are recalled and revisited after the fact.

Kahneman believes this distinction is important because almost all conscious decisions are made by the "remembering self". It is difficult to make decisions in the present because by the time the brain has thought about the decision it needs to make, the present is now past. Thus, how humans process their memories colors how they make decisions. 

The example of an orchestral performance that goes perfectly except for a horrible mistake at the very end is given. The remembering self might say that the experience was ruined, but the experiencing self had 20 minutes of well-played music and 2 seconds of error. But because the memory of the event is all humans get to keep, the 2 seconds at the end color the entire event. 

These two selves are mirrored in Window to the World's architecture. When it processes a file, it does so by running it through various data analysis and decision modules. Its experiencing self is concerned with tagging the file and deciding how to handle it in the queue. Window to the World's remembering self is mirrored by the data storage system. Once the file is moved through the queue, data from that file is processed by the cognitive modules and stored in cognitive maps and categorization trees. 

Thus Window to the World's "experience" of the file and its "memory" of the file is very different, same as a human's experience and memory are different. Furthermore, they are different for the same reason. Both have experiences that are concerned with processing information as it comes in, whereas memory is concerned with sorting and making sense of it for long-term storage and later use. 
