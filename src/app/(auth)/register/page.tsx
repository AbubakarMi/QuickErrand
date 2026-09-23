import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Post errands or start running them. Pick one below.
      </p>
      <div className="mt-6">
        {/* useSearchParams (for the ?role=runner preselect) requires a
            Suspense boundary or the route opts out of static rendering. */}
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </>
  );
}
