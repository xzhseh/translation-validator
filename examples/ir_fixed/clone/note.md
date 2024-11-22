### why fix `clone_rs.ll`?
alive2 claims the two versions are not semantically equivalent for the original version, where the rust ir explicitly calls the `clone` trait - and alive2 thinks the `clone` trait triggers undefined behavior.

### how to fix `clone_rs.ll`?
to resolve this issue, we need to **manually** remove the `clone` trait call and inline the `clone` trait logic into the function body of `clone_point_and_read_x`, see `clone_rs_fixed.ll` for more details.

note that you may need to manually replace this `clone_rs_fixed.ll` based on your generated `clone_rs.ll` if you are using a different platform.
