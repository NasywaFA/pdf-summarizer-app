## Quick Start

To create a project, simply run:

```bash
go mod init <project-name>
```

## Manual Installation

If you would still prefer to do the installation manually, follow these steps:

Clone the repo:

```bash
git clone --depth 1 https://github.com/indrayyana/go-fiber-boilerplate.git
cd go-fiber-boilerplate
rm -rf ./.git
```

Install the dependencies:

```bash
go mod tidy
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```

## Commands

Running locally:

```bash
make start
```

Or running with live reload:

```bash
air
```

> [!NOTE]
> Make sure you have `Air` installed.\
> See 👉 [How to install Air](https://github.com/air-verse/air)

Testing:

```bash
# run all tests
make tests

# run all tests with gotestsum format
make testsum

# run test for the selected function name
make tests-TestUserModel
```

Docker:

```bash
# run docker container
make docker

# run all tests in a docker container
make docker-test
```

Linting:

```bash
# run lint
make lint
```

Swagger:

```bash
# generate the swagger documentation
make swagger
```

Migration:

```bash
# Create migration
make migration-<table-name>

# Example for table users
make migration-users
```

```bash
# run migration up in local
make migrate-up

# run migration down in local
make migrate-down

# run migration up in docker container
make migrate-docker-up

# run migration down all in docker container
make migrate-docker-down
```

## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# server configuration
# Env value : prod || dev
APP_ENV=dev
APP_HOST=0.0.0.0
APP_PORT=3000
APP_URL=http://localhost:3000

ML_SERVICE_URL=http://localhost:8000

# database configuration
DB_HOST=postgresdb
DB_USER=postgres
DB_PASSWORD=thisisasamplepassword
DB_NAME=fiberdb
DB_PORT=5432
```

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--controller\     # Route controllers (controller layer)
 |--database\       # Database connection & migrations
 |--docs\           # Swagger files
 |--middleware\     # Custom fiber middlewares
 |--model\          # Postgres models (data layer)
 |--response\       # Response models
 |--router\         # Routes
 |--service\        # Business logic (service layer)
 |--utils\          # Utility classes and functions
 |--validation\     # Request data validation schemas
 |--main.go         # Fiber app
```

**User routes**:\
`POST /v1/users` - create a user\
`GET /v1/users` - get all users\
`DELETE /v1/users/:userId` - delete user

## Error Handling

The app includes a custom error handling mechanism, which can be found in the `src/utils/error.go` file.

It also utilizes the `Fiber-Recover` middleware to gracefully recover from any panic that might occur in the handler stack, preventing the app from crashing unexpectedly.

The error handling process sends an error response in the following format:

```json
{
  "code": 404,
  "status": "error",
  "message": "Not found"
}
```

Fiber provides a custom error struct using `fiber.NewError()`, where you can specify a response code and a message. This error can then be returned from any part of your code, and Fiber's `ErrorHandler` will automatically catch it.

For example, if you are trying to retrieve a user from the database but the user is not found, and you want to return a 404 error, the code might look like this:

```go
func (s *userService) GetUserByID(c *fiber.Ctx, id string) {
	user := new(model.User)

	err := s.DB.WithContext(c.Context()).First(user, "id = ?", id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}
}
```

## Validation

Request data is validated using [Package validator](https://github.com/go-playground/validator). Check the [documentation](https://pkg.go.dev/github.com/go-playground/validator/v10) for more details on how to write validations.

The validation schemas are defined in the `src/validation` directory and are used within the services by passing them to the validation logic. In this example, the CreateUser method in the userService uses the `validation.CreateUser` schema to validate incoming request data before processing it. The validation is handled by the `Validate.Struct` method, which checks the request data against the schema.

```go
import (
	"app/src/model"
	"app/src/validation"

	"github.com/gofiber/fiber/v2"
)

func (s *userService) CreateUser(c *fiber.Ctx, req validation.CreateUser) (*model.User, error) {
	if err := s.Validate.Struct(&req); err != nil {
		return nil, err
	}
}
```

## Authentication

To require authentication for certain routes, you can use the `Auth` middleware.

```go
import (
	"app/src/controllers"
	m "app/src/middleware"
	"app/src/services"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, u services.UserService, t services.TokenService) {
  userController := controllers.NewUserController(u, t)
	app.Post("/users", m.Auth(u), userController.CreateUser)
}
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.