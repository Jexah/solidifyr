# Solidifyr
#### Modern object-oriented development environment hosted on the cloud.

Designed with three core ideas in mind:
* Create a new collaborative editing paradigm.
* Assist with design and visualisation an object-oriented project.
* Make unit testing more simple and easier to implement.

---

### New collaborative editing paradigm
Solidifyr is a new approach to small-team agile object-oriented project development. It abstracts away the traditional "file" interface we use in integrated development environments, by presenting the project as it would be seen in a class diagram. This allows us to group functions with their unit tests, and only publish the functions that are successfully validated by the unit tests, allowing modification of multiple functions in the same class by multiple people, without disrupting each other.

---

### Design and visualisation
I, among others, have experienced joining an existing team working on a large project that has no visual representation of structure. Jumping into these projects requires a lot of reading, brain power, and time, to understand where everything is and what exactly each object is responsible for. Laying out the code in an abstract object-centric mannor will assist in quickly understanding a project that you haven't seen before, help you make decisions as to how unimplemented classes and features should be implemented in the context of the design of the project, and aid in understanding collaborator's thought processes when implementing classes and functions.

---

### Unit testing
Features are very infrequently removed from APIs, due to apps being build on top of the APIs. Object-oriented programming is similar, and so features that are in use by other classes, should rarely be removed. An issue that occurs with git, is conflicts. They are tedius to patch at best, and at worst make two people realise they just spent several days implementing the same functionality. If you don't want conflicts, you commit and push regularly to let your team know what you are working on, but if you haven't passed the tests, you can't push bad code. What is the solution? Real time editing allows people see exactly what their team members are working on, and prevents them from overriding or comflicting with each other, but what if one team member needs to build the project while another team member is mid-way through editing a function that is required?

Only publish the most recent code that passes all of the unit tests. This requires substancial unit tests. To make unit testing easier, we pair unit tests with functions, so they are easy to edit side by side.

---

### Secondary goals
Implement a wiki-style page for each node where any useful information can be stored, such as details on how to use a function, or current known technical limitations or issues that explain why the function is built the way it is (seperate from "issues" that would list why a function isn't operating correctly). [Basically a nicer version of "summaries" in traditional IDEs]

---

### Build
*This assumes you have nodejs, npm, grunt, and mongodb installed.*

Simply clone the package using:

`$ git clone https://github.com/jexah/solidifyr.git`

Then change to the root directory of the project and update to install dependencies:

`$ cd solidifyr && npm install`

---

### Run
*This assumes you have nodejs, npm, grunt, and mongodb installed.*

Start by opening your local mongodb server and specifying the database path:
`$ mongodb --dbpath "./db"`

Then just run the server using grunt:

`$ grunt`