// 50 Standard Technical Questions for Assessment
const QUESTIONS_BANK = [
  {
    qno: 1,
    category: "C Programming",
    question: "What will be the output of the following C code segment?\nint a = 5;\nprintf(\"%d %d %d\", a, ++a, a++);",
    options: {
      A: "5 6 6",
      B: "7 7 5 (Compiler/Order-of-evaluation dependent)",
      C: "6 6 5",
      D: "Compilation Error"
    },
    correct: "B",
    explanation: "In C, the order of evaluation of function arguments in printf() is unspecified by the standard (often right-to-left in GCC/Clang), leading to undefined behavior when modified multiple times without a sequence point."
  },
  {
    qno: 2,
    category: "Data Structures",
    question: "What is the worst-case time complexity of searching for an element in a Balanced Binary Search Tree (AVL / Red-Black Tree) containing 'n' elements?",
    options: {
      A: "O(1)",
      B: "O(n)",
      C: "O(log n)",
      D: "O(n log n)"
    },
    correct: "C",
    explanation: "Self-balancing trees like AVL or Red-Black trees guarantee height h <= c * log2(n), ensuring search operations take O(log n) time even in the worst case."
  },
  {
    qno: 3,
    category: "Data Structures",
    question: "Which data structure follows the LIFO (Last-In-First-Out) principle?",
    options: {
      A: "Queue",
      B: "Stack",
      C: "Linked List",
      D: "Binary Heap"
    },
    correct: "B",
    explanation: "A Stack operates on the Last-In-First-Out (LIFO) principle, where the element pushed last is the first one popped."
  },
  {
    qno: 4,
    category: "Algorithms",
    question: "Which sorting algorithm maintains a guaranteed worst-case time complexity of O(n log n) and is stable?",
    options: {
      A: "Quick Sort",
      B: "Merge Sort",
      C: "Heap Sort",
      D: "Selection Sort"
    },
    correct: "B",
    explanation: "Merge Sort operates with O(n log n) time in all cases (best, average, worst) and preserves the relative order of duplicate elements (stable)."
  },
  {
    qno: 5,
    category: "SQL & Databases",
    question: "Which SQL clause is used to filter records resulting from a GROUP BY aggregation?",
    options: {
      A: "WHERE",
      B: "FILTER",
      C: "HAVING",
      D: "ORDER BY"
    },
    correct: "C",
    explanation: "The HAVING clause was introduced into SQL because the WHERE keyword cannot be applied directly on aggregate functions like COUNT, AVG, or SUM."
  },
  {
    qno: 6,
    category: "SQL & Databases",
    question: "In relational database transactions, what does the 'I' in the ACID properties represent?",
    options: {
      A: "Integrity",
      B: "Isolation",
      C: "Indexability",
      D: "Iteration"
    },
    correct: "B",
    explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation guarantees that concurrently executing transactions do not interfere with each other."
  },
  {
    qno: 7,
    category: "Python",
    question: "What is the boolean evaluation of `bool([])` and `bool([0])` in Python?",
    options: {
      A: "False, False",
      B: "False, True",
      C: "True, False",
      D: "True, True"
    },
    correct: "B",
    explanation: "An empty list `[]` is falsy in Python and evaluates to False, whereas `[0]` is a non-empty list with one element (even though the element is 0), so it evaluates to True."
  },
  {
    qno: 8,
    category: "Python",
    question: "Which of the following built-in data types in Python is immutable?",
    options: {
      A: "List",
      B: "Dictionary",
      C: "Set",
      D: "Tuple"
    },
    correct: "D",
    explanation: "Tuples, strings, and integers in Python are immutable; once allocated, their contents cannot be altered in-place."
  },
  {
    qno: 9,
    category: "Operating Systems",
    question: "Which of the following is NOT one of the four necessary Coffman conditions for a Deadlock to occur?",
    options: {
      A: "Mutual Exclusion",
      B: "Hold and Wait",
      C: "Preemption",
      D: "Circular Wait"
    },
    correct: "C",
    explanation: "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. 'Preemption' actually resolves deadlocks, while 'No Preemption' is the necessary condition."
  },
  {
    qno: 10,
    category: "Operating Systems",
    question: "What is the primary role of the Translation Lookaside Buffer (TLB) in virtual memory?",
    options: {
      A: "Cache secondary disk blocks",
      B: "Cache page table address translations (Virtual to Physical)",
      C: "Hold CPU machine registers",
      D: "Coordinate CPU core interrupts"
    },
    correct: "B",
    explanation: "The TLB is a high-speed associative hardware cache that caches recent virtual-to-physical address mappings from page tables."
  },
  {
    qno: 11,
    category: "Computer Networks",
    question: "At which layer of the OSI model does the TCP (Transmission Control Protocol) operate?",
    options: {
      A: "Network Layer",
      B: "Data Link Layer",
      C: "Transport Layer",
      D: "Application Layer"
    },
    correct: "C",
    explanation: "TCP and UDP are core protocols of Layer 4 (Transport Layer), providing process-to-process communication and flow/error control."
  },
  {
    qno: 12,
    category: "Computer Networks",
    question: "What standard port number is reserved for secure HTTPS web communications?",
    options: {
      A: "80",
      B: "21",
      C: "443",
      D: "8080"
    },
    correct: "C",
    explanation: "Port 80 is used for plaintext HTTP, whereas Port 443 is universally designated for HTTP over TLS/SSL (HTTPS)."
  },
  {
    qno: 13,
    category: "Java",
    question: "Which keyword in Java is used to prevent a method from being overridden by subclasses?",
    options: {
      A: "static",
      B: "final",
      C: "abstract",
      D: "synchronized"
    },
    correct: "B",
    explanation: "Marking a method `final` in Java ensures that subclasses cannot override or hide its implementation."
  },
  {
    qno: 14,
    category: "Java",
    question: "In Java, what is the default value of an uninitialized instance variable of type boolean?",
    options: {
      A: "true",
      B: "false",
      C: "null",
      D: "0"
    },
    correct: "B",
    explanation: "Instance boolean variables in Java are initialized by default to false by the JVM."
  },
  {
    qno: 15,
    category: "OOP Concepts",
    question: "Which Object-Oriented principle allows entities to take on different forms and respond dynamically to identical method calls?",
    options: {
      A: "Encapsulation",
      B: "Data Hiding",
      C: "Polymorphism",
      D: "Inheritance"
    },
    correct: "C",
    explanation: "Polymorphism enables an object or method invocation to behave differently based on the actual runtime object type."
  },
  {
    qno: 16,
    category: "Data Structures",
    question: "What is the minimum number of queues required to implement a standard LIFO Stack?",
    options: {
      A: "1",
      B: "2",
      C: "3",
      D: "Cannot be implemented"
    },
    correct: "A",
    explanation: "A stack can be simulated with just 1 queue by rotating elements (size - 1 times) on each push operation so the latest element always remains at the front."
  },
  {
    qno: 17,
    category: "Data Structures",
    question: "What is the time complexity to insert a new node at the head of a singly linked list?",
    options: {
      A: "O(1)",
      B: "O(n)",
      C: "O(log n)",
      D: "O(n^2)"
    },
    correct: "A",
    explanation: "Inserting at the head requires only re-pointing the new node's next pointer to the current head and updating the head reference, requiring O(1) constant time."
  },
  {
    qno: 18,
    category: "Algorithms",
    question: "Dijkstra's Algorithm is formulated to solve which problem?",
    options: {
      A: "Minimum Spanning Tree",
      B: "Single Source Shortest Path with non-negative edge weights",
      C: "Shortest path in graphs containing negative cycles",
      D: "Bipartite Graph Matching"
    },
    correct: "B",
    explanation: "Dijkstra's algorithm computes the shortest path from a single source to all vertices in graphs where all edge weights are non-negative."
  },
  {
    qno: 19,
    category: "Algorithms",
    question: "What is the worst-case space complexity of recursive Depth First Search (DFS) on a graph with V vertices?",
    options: {
      A: "O(1)",
      B: "O(V) for the call stack",
      C: "O(V^2)",
      D: "O(E * V)"
    },
    correct: "B",
    explanation: "If the graph forms a single linear chain of V vertices, the recursion call stack will reach depth V, taking O(V) auxiliary space."
  },
  {
    qno: 20,
    category: "C Programming",
    question: "What does the expression `sizeof(char)` evaluate to according to the ANSI C standard?",
    options: {
      A: "Always 1 byte",
      B: "2 bytes",
      C: "4 bytes",
      D: "Architecture dependent"
    },
    correct: "A",
    explanation: "By definition in the ISO/ANSI C specification, `sizeof(char)` is always guaranteed to be exactly 1 byte."
  },
  {
    qno: 21,
    category: "C Programming",
    question: "Which dynamic memory allocation function in C initializes all allocated bytes to zero?",
    options: {
      A: "malloc()",
      B: "calloc()",
      C: "realloc()",
      D: "valloc()"
    },
    correct: "B",
    explanation: "`calloc(num, size)` allocates contiguous memory for elements and automatically clears every bit in the block to zero."
  },
  {
    qno: 22,
    category: "SQL & Databases",
    question: "Which database Normal Form eliminates partial functional dependencies on a composite primary key?",
    options: {
      A: "1NF",
      B: "2NF",
      C: "3NF",
      D: "BCNF"
    },
    correct: "B",
    explanation: "A table is in 2NF if it is in 1NF and no non-prime attribute is partially dependent on any candidate key."
  },
  {
    qno: 23,
    category: "SQL & Databases",
    question: "Which of the following SQL statements is a Data Definition Language (DDL) command?",
    options: {
      A: "INSERT",
      B: "UPDATE",
      C: "TRUNCATE",
      D: "DELETE"
    },
    correct: "C",
    explanation: "TRUNCATE drops and recreates the underlying table structure, categorizing it as DDL along with CREATE, ALTER, and DROP."
  },
  {
    qno: 24,
    category: "Operating Systems",
    question: "What phenomenon in virtual memory is characterized by excessive swapping between RAM and disk?",
    options: {
      A: "Starvation",
      B: "Thrashing",
      C: "Fragmentation",
      D: "Deadlock"
    },
    correct: "B",
    explanation: "Thrashing happens when the total memory demand exceeds physical RAM, causing the OS to spend more time swapping pages than running user processes."
  },
  {
    qno: 25,
    category: "Operating Systems",
    question: "Which non-preemptive CPU scheduling algorithm guarantees the minimum average waiting time?",
    options: {
      A: "First-Come First-Served (FCFS)",
      B: "Round Robin (RR)",
      C: "Shortest Job First (SJF)",
      D: "Priority Scheduling"
    },
    correct: "C",
    explanation: "Shortest Job First (SJF) is mathematically optimal with respect to minimizing average waiting time for a static batch of processes."
  },
  {
    qno: 26,
    category: "Computer Networks",
    question: "Which protocol translates a known 32-bit IPv4 address into its corresponding physical 48-bit MAC address?",
    options: {
      A: "DNS",
      B: "ARP",
      C: "DHCP",
      D: "RARP"
    },
    correct: "B",
    explanation: "Address Resolution Protocol (ARP) resolves logical network-layer IP addresses into physical data-link layer MAC addresses."
  },
  {
    qno: 27,
    category: "Computer Networks",
    question: "What is the address length of an IPv6 IP address?",
    options: {
      A: "32 bits",
      B: "64 bits",
      C: "128 bits",
      D: "256 bits"
    },
    correct: "C",
    explanation: "IPv6 uses 128-bit addresses, written in 8 groups of 4 hexadecimal digits separated by colons."
  },
  {
    qno: 28,
    category: "JavaScript",
    question: "What is the return value of `typeof NaN` in standard JavaScript?",
    options: {
      A: "\"undefined\"",
      B: "\"nan\"",
      C: "\"number\"",
      D: "\"object\""
    },
    correct: "C",
    explanation: "In JavaScript, NaN stands for 'Not a Number', but its underlying primitive type is specified by IEEE-754 as a numeric type, so `typeof NaN === 'number'`."
  },
  {
    qno: 29,
    category: "JavaScript",
    question: "Which array method returns a newly created array containing only elements that pass a boolean test function?",
    options: {
      A: "map()",
      B: "reduce()",
      C: "filter()",
      D: "find()"
    },
    correct: "C",
    explanation: "`filter()` iterates through an array and produces a new filtered array with elements for which the callback returns a truthy value."
  },
  {
    qno: 30,
    category: "Data Structures",
    question: "What is the time complexity to access the minimum element from a Binary Min-Heap of n nodes?",
    options: {
      A: "O(1)",
      B: "O(log n)",
      C: "O(n)",
      D: "O(n log n)"
    },
    correct: "A",
    explanation: "In a min-heap, the smallest value is always positioned at the root node (index 0), so inspecting it takes O(1) time."
  },
  {
    qno: 31,
    category: "Data Structures",
    question: "Which traversal of a Binary Search Tree (BST) produces keys in ascending order?",
    options: {
      A: "Pre-order",
      B: "In-order",
      C: "Post-order",
      D: "Level-order"
    },
    correct: "B",
    explanation: "In-order traversal visits Left -> Root -> Right, which strictly yields sorted keys in any valid BST."
  },
  {
    qno: 32,
    category: "Algorithms",
    question: "What is the time complexity of Kadane's Algorithm for finding the Maximum Subarray Sum?",
    options: {
      A: "O(n^2)",
      B: "O(n log n)",
      C: "O(n)",
      D: "O(1)"
    },
    correct: "C",
    explanation: "Kadane's algorithm scans the array in a single linear pass maintaining current and maximum sums, yielding O(n) complexity."
  },
  {
    qno: 33,
    category: "Algorithms",
    question: "What mandatory prerequisite must an array satisfy before Binary Search can be executed on it?",
    options: {
      A: "Elements must be unique",
      B: "Array must be sorted",
      C: "Array size must be a power of 2",
      D: "Elements must be contiguous integers"
    },
    correct: "B",
    explanation: "Binary search eliminates half of the remaining search space based on relative comparison, which requires the elements to be sorted."
  },
  {
    qno: 34,
    category: "Python",
    question: "What will `print([x * 2 for x in range(3)])` output in Python 3?",
    options: {
      A: "[0, 2, 4]",
      B: "[2, 4, 6]",
      C: "[0, 1, 2]",
      D: "[0, 2, 4, 6]"
    },
    correct: "A",
    explanation: "`range(3)` produces values 0, 1, 2. Multiplying each by 2 creates the list `[0, 2, 4]`."
  },
  {
    qno: 35,
    category: "Python",
    question: "Which block in Python exception handling is guaranteed to execute regardless of whether an exception was raised or not?",
    options: {
      A: "catch",
      B: "finally",
      C: "always",
      D: "except"
    },
    correct: "B",
    explanation: "The `finally` clause executes under all circumstances, typically utilized for releasing resources like open database sockets or file handles."
  },
  {
    qno: 36,
    category: "OOP Concepts",
    question: "The bundling of data fields and methods operating on that data into a protective capsule is called:",
    options: {
      A: "Polymorphism",
      B: "Inheritance",
      C: "Encapsulation",
      D: "Abstraction"
    },
    correct: "C",
    explanation: "Encapsulation wraps state and behavior together inside a class, concealing internal state from direct external modification."
  },
  {
    qno: 37,
    category: "OOP Concepts",
    question: "Can a constructor in Java or C++ be declared static?",
    options: {
      A: "Yes, in all classes",
      B: "No, constructors cannot be static",
      C: "Only in abstract base classes",
      D: "Only when the class has no fields"
    },
    correct: "B",
    explanation: "Constructors are invoked to instantiate and initialize a specific object instance. Static members belong to the class itself, so a constructor cannot be static."
  },
  {
    qno: 38,
    category: "SQL & Databases",
    question: "Which SQL JOIN returns all rows whenever there is a match in either the left or the right table?",
    options: {
      A: "INNER JOIN",
      B: "LEFT JOIN",
      C: "FULL OUTER JOIN",
      D: "CROSS JOIN"
    },
    correct: "C",
    explanation: "A FULL OUTER JOIN merges results of both LEFT and RIGHT joins, populating missing values with NULLs whenever matches are absent."
  },
  {
    qno: 39,
    category: "SQL & Databases",
    question: "What is the primary benefit of creating an index on a frequently queried database column?",
    options: {
      A: "Reduces table storage size",
      B: "Accelerates SELECT and search operations",
      C: "Speeds up bulk INSERT operations",
      D: "Encrypts table records"
    },
    correct: "B",
    explanation: "Indexes (typically B-Trees) enable rapid logarithmic row lookup during SELECT queries, avoiding expensive full table scans."
  },
  {
    qno: 40,
    category: "Operating Systems",
    question: "A synchronization primitive with integer values constrained strictly to 0 and 1 is known as a:",
    options: {
      A: "Counting Semaphore",
      B: "Binary Semaphore (Mutex)",
      C: "Spinlock Barrier",
      D: "Monitor Buffer"
    },
    correct: "B",
    explanation: "A Binary Semaphore toggles between 0 and 1, functioning identically to a mutual exclusion lock (Mutex) to guard critical code blocks."
  },
  {
    qno: 41,
    category: "Operating Systems",
    question: "Which CPU hardware register holds the memory address of the next instruction to be fetched and executed?",
    options: {
      A: "Instruction Register (IR)",
      B: "Memory Address Register (MAR)",
      C: "Program Counter (PC)",
      D: "Stack Pointer (SP)"
    },
    correct: "C",
    explanation: "The Program Counter (PC) keeps track of the sequential memory address of the upcoming instruction to be fetched into the execution pipeline."
  },
  {
    qno: 42,
    category: "Computer Networks",
    question: "What is the standard Maximum Transmission Unit (MTU) payload size for Ethernet Layer-2 frames?",
    options: {
      A: "512 bytes",
      B: "1024 bytes",
      C: "1500 bytes",
      D: "65535 bytes"
    },
    correct: "C",
    explanation: "The classic IEEE 802.3 standard defines the default MTU payload for Ethernet frames as 1500 bytes."
  },
  {
    qno: 43,
    category: "Computer Networks",
    question: "Which Transport Layer protocol is connectionless and prioritizes low latency without delivery acknowledgments?",
    options: {
      A: "TCP",
      B: "UDP",
      C: "FTP",
      D: "SCTP"
    },
    correct: "B",
    explanation: "User Datagram Protocol (UDP) transmits packets without connection setup or acknowledgments, making it ideal for streaming and gaming."
  },
  {
    qno: 44,
    category: "Aptitude & Logic",
    question: "A train traveling at 72 km/h crosses a 200m platform in 22 seconds. What is the length of the train?",
    options: {
      A: "220 meters",
      B: "240 meters",
      C: "260 meters",
      D: "250 meters"
    },
    correct: "B",
    explanation: "Speed = 72 * (5/18) = 20 m/s. Total distance = 20 * 22 = 440m. Train length = 440 - 200 = 240 meters."
  },
  {
    qno: 45,
    category: "Aptitude & Logic",
    question: "A and B together can finish a task in 12 days. B alone can finish it in 20 days. How many days will A take working alone?",
    options: {
      A: "25 days",
      B: "30 days",
      C: "35 days",
      D: "40 days"
    },
    correct: "B",
    explanation: "1/A = 1/12 - 1/20 = (5 - 3)/60 = 2/60 = 1/30. Therefore, A alone takes 30 days."
  },
  {
    qno: 46,
    category: "Data Structures",
    question: "What is the average time complexity of lookups and insertions in an efficient Hash Table?",
    options: {
      A: "O(1)",
      B: "O(log n)",
      C: "O(n)",
      D: "O(n^2)"
    },
    correct: "A",
    explanation: "With a uniform hash distribution and reasonable load factor, average hash table lookups execute in O(1) constant time."
  },
  {
    qno: 47,
    category: "C Programming",
    question: "What will `printf(\"%d\", 10 >> 2);` display when compiled in C?",
    options: {
      A: "40",
      B: "2",
      C: "5",
      D: "20"
    },
    correct: "B",
    explanation: "Right bitwise shift `10 >> 2` divides 10 by 2^2 (4) using integer division, producing 2."
  },
  {
    qno: 48,
    category: "Algorithms",
    question: "Which algorithmic paradigm is applied to solve the 0/1 Knapsack Problem and Longest Common Subsequence?",
    options: {
      A: "Greedy Strategy",
      B: "Divide and Conquer",
      C: "Dynamic Programming",
      D: "Branch and Bound"
    },
    correct: "C",
    explanation: "Both problems have overlapping subproblems and optimal substructure, solved efficiently via Dynamic Programming."
  },
  {
    qno: 49,
    category: "Java",
    question: "Which of the following Java collection classes is synchronized and thread-safe by default?",
    options: {
      A: "ArrayList",
      B: "Vector",
      C: "HashMap",
      D: "LinkedList"
    },
    correct: "B",
    explanation: "The `Vector` class synchronizes its operations, making it inherently thread-safe in contrast to `ArrayList`."
  },
  {
    qno: 50,
    category: "Computer Networks",
    question: "What is the primary role of the Domain Name System (DNS)?",
    options: {
      A: "Packet firewall filtering",
      B: "Resolving human-readable domain names into IP addresses",
      C: "Dynamically allocating subnet masks",
      D: "Encrypting transport layer payloads"
    },
    correct: "B",
    explanation: "DNS operates as the internet's naming directory, resolving domain strings (e.g. portal.edu) into routable IP addresses."
  }
];
