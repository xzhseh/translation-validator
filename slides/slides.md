# Translation Validation For LLVM IR(s)<br><a href="#0">💨</a> From C++ <a href="#0">🤨</a> to Rust <a href="#0">🤩</a>
Zihao Xu @ Purdue University, West Lafayette



# Overview<br>(a.k.a. What's the problem here?) <a href="#overview">🤔</a>
- Rust is becoming popular 🔥
  - nice language features to guarantee the so-called "<span class="gradient-text">**memory safety**</span>"
  - looks modern and cool!
  - ~~"fighting with `rustc` makes my day 😅😅😅"~~
- Industries are migrating largely from C++ to Rust
  - surely rewriting everything from top-to-bottom
- And..
  - Rust and C++ are largely different in many aspects
    - semantics/features/type systems/etc..
  - the original C++ code <span class="gradient-text">**VS.**</span> the translated Rust code
    - the translation for critical components needs to be verified
    - should be semantically equivalent
    - but what is "<span class="gradient-text-underlined">**semantic equivalence**</span>"?
      - and in which level?



# Any existing work? <a href="#2">😲</a>
- <span class="gradient-text">**CBMC**</span> <a href="https://www.cprover.org/cbmc/" target="_blank">🔗</a>
  - initially for C/C++ bounded model checking
  - check kani <a href="https://model-checking.github.io/kani/getting-started.html" target="_blank">🔗</a> for Rust
  - relies on the <span class="gradient-text">**internal GOTO programs**</span> for verification
  - another choice for translation validation between two distinct languages with some tweaks
- <span class="gradient-text">**c2rust**</span> <a href="https://c2rust.com" target="_blank">🔗</a>
  - focus more on translation rather than validation
  - for the translation, hmm..
    - source C <span class="media-hover" style="--hover-image: url('./images/original_c.png')">📖</span> → translated Rust <span class="media-hover" style="--hover-image: url('./images/translated_rust.png')">🦀</span>
- <span class="gradient-text">**Alive2**</span> <a href="https://github.com/AliveToolkit/alive2" target="_blank">🔗</a> (my choice! 😂😭😅😇🥰)
  - focus on <span class="gradient-text">**LLVM IR level's validation**</span>
    - especially for different optimization levels
  - of course, relies on LLVM IR as the shared "semantic space"
    - easy to generate compared to the ***"GOTO programs"*** from CBMC
  - a <span class="gradient-text">**"black-box"**</span> 📦..



# My answer <a href="#3">😎</a>
- two distinct versions that uses the same validation logic
  - <span class="gradient-text">**Standalone**</span>
    - good for local quick validation
    - can tweak the generated IRs directly
  - <span class="gradient-text">**Full-Stack**</span>
    - modern, beautiful<sup>[1]</sup> user interface to interact with
    - robust backend infrastructure that supports parallel validation(s)
      - <span class="gradient-text">**RelayServer**</span> & <span class="gradient-text">**ValidatorServer**</span>
    - helpful tooltips to guide (external) users that {may/may not} be familiar with <span class="gradient-text">{model checking/alive2/rust/c++/llvm/etc..}</span>.
    - (~~I've spent a lot of time on the {integration/UI/UX/deployment}, so~~ I love this version the most. 😅😍)
- multiple {working/not working} examples <a href="https://github.com/xzhseh/translation_validator/tree/main/examples" target="_blank">🔗</a> to check/test the functionality of alive2.
  - mostly shared by the two versions.

<div class="citation-container">
    <hr class="citation-divider">
    <div class="citations">
        <p class="citation">[1] For some definitions of "beautiful".</p>
    </div>
</div>


# Standalone
- <span class="gradient-text">**Pros:**</span>
  - directly build and run through your terminal!
  - could directly manipulate the generated IRs to test different functionalities
  - flexible and easy to extend
  - contains the option to specify the `ir_fixed` directory to validate
    - but what is `ir_fixed`? and why we need it? 🤨 <a href="#6">📎</a>
- <span class="gradient-text">**Cons:**</span>
  - needs to manually write the source C++ code/target Rust code, and generate the IRs through the provided scripts, i.e., `src2ir.py`.
  - hard to interpret the results from alive2


# Full-Stack
> <img src="./images/architecture.svg" alt="architecture" style="width: 80%; height: auto; display: block; margin: 0 auto;">

- consists of:
  - frontend (i.e., <span class="gradient-text">**validator-frontend/**</span>)
  - backend (i.e., <span class="gradient-text">**RelayServer**</span> & <span class="gradient-text">**ValidatorServer**</span>)
- users could directly write the source C++ code/target Rust code and validate them through the frontend!


# Demo Time! <a href="#demo">🫰🤪🥰😍🤩😎🫰</a>
- Let's first try the standalone version locally..
- <span class="gradient-text-underlined">**Then let's try it out together!**</span> <a href="https://translation-validator.com" target="_blank">🔗</a> 😎



# Towards the future <a href="#4">🚀</a>
- <span class="gradient-text">**Practicality**</span> 🤩 vs. <span class="gradient-text">**Impracticality**</span> 😅🤨😅
- Which is the right way to go? 😮‍💨


# Practicality <a href="#4/1">🤩</a>
- Quick & neat tool for simple translation validation
  - good to validate simple (better be pure) function pairs
  - the <span class="gradient-text">**swiss army knife**</span> for simple validation
- Utilize the ***"State-Of-The-Art"*** Alive2's validation/verification logic
  - encode robust SMT queries under the hood
  - leverage Z3 solver to reason about the semantic equivalence
  - proved its practicality by finding bugs in LLVM 👍

> <img src="./images/smt_query.png" alt="SMT query used by alive2" style="width: 80%; height: auto; display: block; margin: 0 auto;">


# Impracticality <a href="#4/2">😅🤨😅</a> (1)
Limitations are (extremely/unexpectedly/expectedly) <span class="gradient-text">**HUGE**</span>.. 🤦‍♂️
- unsupported LLVM IR features/instructions are a LOT!
  - `invoke`, `landingpad`, `atomicrmw`, `atomicload`, `atomicstore`, etc.
  - all your favorite concurrent/atomic operations are not supported..
  - quote from alive2's paper <sup>[1]</sup>
    - <span class="media-hover" style="--hover-image: url('./images/unsupported_llvm_features.png')">📖</span>
- limited support for validation between cross-language/frontend generated IR pairs
  - hard to directly compare the IR generated by, e.g., `rustc` vs. `clang++`.
  - often need manual modifications/tweaks
    - remember the `ir_fixed`?
  - after all, it's not <span class="gradient-text">**"primarily designed"**</span> for this! 🤷‍♂️
    - build your own ***"alive2"*** would then be a complete, different story.

<div class="citation-container">
    <hr class="citation-divider">
    <div class="citations">
        <p class="citation">[1] Alive2: Bounded Translation Validation for LLVM. <a href="https://doi.org/10.1145/3453483.3454030" target="_blank">🔗</a></p>
    </div>
</div>


# Impracticality <a href="#4/3">😅🤨😅</a> (2)
- complex function pairs' validation is mostly impossible
  - nested function calls
    - need manually inlining to validate
    - otherwise would be trivially rejected by alive2
      - <span class="gradient-text">**"target should always be refined than source"**</span>
  - unexpected function attributes, e.g., ***"noundef"***.
    - automatically generated by frontend in a **purely syntactic** way.
  - language-specific semantics/features
    - special syntax/features (e.g., ownership vs. ***"std::unique_ptr"***)
    - standard library
      - the IRs do not type check <span class="gradient-text">**infinitely often**</span>..
    - not to mention the potential (external) runtime
      - e.g., the Rust async runtime <span class="gradient-text">***"tokio"***</span>
- does not scale well with complex patterns/structures


# The right way to go? <a href="#4/4">🧐</a> (1)
- A monolithic, "hardcoded" formal verification tool
  - <span class="gradient-text">**Alive2**</span>, <span class="gradient-text">**CBMC**</span>, <span class="gradient-text">**Dafny**</span> are good examples
  - for broad, general verification between, say, C++ and Rust pairs
    - requires a custom/specific model checker
    - needs a specific, generalized, shared, equivalent IR to help with the verification
      - e.g., the <span class="gradient-text">**GOTO programs**</span> from CBMC
      - should take the language-specific semantics/features into consideration
    - extremely hard to generalize
      - lots of, lots of hard-coded stuffs..
    - the above requirements are probably needed for each new language pair's validation
    - hard to have a <span class="gradient-text">***"docker-like"***</span> graceful solution to accommodate all


# The right way to go? <a href="#4/5">🧐</a> (2)
- By utilizing different high-level/language-specific <span class="gradient-text">**tests**</span>
  - Simple Unit Tests
  - Property-Based Testing <sup>[1]</sup>
  - Fuzzy Testing <sup>[2]</sup>
  - {E2E/Integration/Deterministic/etc..} Tests
  - only need to ***"translate"*** the tests to be equivalent
  - passing all the tests in both original and translated versions should be good to go
  - but..
  - <span class="gradient-text">**is this sufficient?**</span>

<div class="citation-container">
    <hr class="citation-divider">
    <div class="citations">
        <p class="citation">[1] & [2]: Brief introduction of Property-Based Testing & Fuzz Testing by Kani. <a href="https://model-checking.github.io/kani/tool-comparison.html#comparison-with-other-tools" target="_blank">🔗</a></p>
    </div>
</div>


# The right way to go? <a href="#4/6">🧐</a> (3)
- Hybrid approach
  - for those currently <span class="gradient-text">**hard-to-support**</span> validation pairs
    - use the second approach to help verify the "<span class="gradient-text">**high-level**</span>" semantic equivalence
    - different combinations of tests could likely catch most of the <span class="gradient-text-underlined">**semantic discrepancies**</span> between the original and translated code.
  - for single function modules, treat them as "black-box" and apply formal verification by existing tools
    - may need some tweaks
    - e.g., manual inlining, converting the function modules, etc.
  - <span class="gradient-text-underlined">**"have the cake and eat it too!"**</span> 🤤



# Ending <a href="#5">🥳🥳🥳</a>
> **"What I cannot build, I do not understand."** — Richard Feynman

- My last project at Purdue.
- It feels good to write code.
- After all, Computer Science is beautiful <sup>[1]</sup>.

<div class="citation-container">
    <hr class="citation-divider">
    <div class="citations">
        <p class="citation">[1] As always, for some definitions of "beautiful".</p>
    </div>
</div>



# ir_fixed? <a href="#3/1">🔙</a>
- a collection of the IR files that are manually ***"fixed"*** by me
- could be used to compare with the normal IR files to see the differences
- may be accompanied by an explanation file in each directory to record the changes made and the reasons.
- example of `add` <a href="https://github.com/xzhseh/translation_validator/blob/main/examples/ir_fixed/add/note.md" target="_blank">🔗</a>
  - `clang` adds the `nsw` flag (and the potential `noundef` attribute) in a <span class="gradient-text">**purely syntactic**</span><sup>[1]</sup> way.
    - by strictly following the <span class="gradient-text">**C++ language specification**</span>, the `nsw` flag is added to the `add` instruction in the generated LLVM IR.
  - the subsequent passes ignore this attribute and generate targets without the `nsw` flag.
    - leads to the ***"verification success"*** when validated by alive2..
    - where the original C++ code obviously has different semantics compared to the translated Rust code.

<div class="citation-container">
    <hr class="citation-divider">
    <div class="citations">
        <p class="citation">[1] That is, without considering the actual language semantics.</p>
    </div>
</div>
