---
layout: post

title: "Get the current database connection information with Ecto and Phoenix"
---

How does one get the database name of the current connection / [Ecto
Repo](https://hexdocs.pm/ecto/Ecto.Repo.html) that you're using in your Phoenix
app? Well, the way you do it is to look at how the credentials are configured.

In Phoenix, we use the `config` command which comes from
[Config](https://hexdocs.pm/elixir/1.12/Config.html). In turn, MyApp.Repo that
you invoke with `use Ecto.Repo` reads that configuration.

For our purposes, we'll use Application.fetch_env from the Config package to
retrieve the value for that Repo:

```elixir
iex(mm-36@rem-a-mcamp)1> Application.get_env(:my_app, MyApp.Repo)
[
  adapter: Ecto.Adapters.Postgres,
  migration_primary_key: [id: :uuid, type: :binary_id],
  migration_timestamps: [type: :utc_datetime_usec],
  telemetry_prefix: [:my_app, :repo],
  show_sensitive_data_on_connection_error: true,
  database: "myapp",
  hostname: "localhost",
  password: "",
  pool_size: 10,
  port: 5432,
  timeout: 10000,
  username: "postgres",
  min_results_estimated_count: 50000
]
```

As you can see, we can get information like the database name etc.

How is that set in the first place, you may ask? We may configure it initially within a config/\*.exs file:

```elixir
config :my_app, MyApp.Repo,
  adapter: Ecto.Adapters.Postgres,
  migration_primary_key: [id: :uuid, type: :binary_id],
  migration_timestamps: [type: :utc_datetime_usec],
  telemetry_prefix: [:my_app, :repo]

config :my_app, MyApp.Repo,
  hostname: System.get_env("POSTGRES_HOSTNAME", "localhost"),
  password: System.get_env("POSTGRES_PASSWORD", "password"),
  pool_size: String.to_integer(System.get_env("POSTGRES_POOL_SIZE", "50")),
  port: String.to_integer(System.get_env("POSTGRES_PORT", "5432")),
  timeout: String.to_integer(System.get_env("POSTGRES_QUERY_TIMEOUT", "10000")),
  username: System.get_env("POSTGRES_USERNAME", "postgres"),

```
