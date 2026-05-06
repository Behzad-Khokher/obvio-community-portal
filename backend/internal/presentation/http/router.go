package http

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Router struct {
	portal     *PortalHandler
	trial      *TrialHandler
	event      *EventHandler
	annotation *AnnotationHandler
	insights   *InsightsHandler
	videoRoot  string
}

func NewRouter(
	portal *PortalHandler,
	trial *TrialHandler,
	event *EventHandler,
	annotation *AnnotationHandler,
	insights *InsightsHandler,
	videoRoot string,
) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	r.Static("/videos", videoRoot)
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		portals := v1.Group("/portals")
		{
			portals.GET("", portal.List)
			portals.POST("", portal.Create)
			portals.GET("/:id", portal.Get)
			portals.PUT("/:id", portal.Update)
			portals.DELETE("/:id", portal.Delete)
			portals.GET("/:id/trials", trial.List)
			portals.POST("/:id/trials", trial.Create)
			portals.GET("/:id/insights", insights.Get)
		}

		trials := v1.Group("/trials")
		{
			trials.GET("/:id", trial.Get)
			trials.PUT("/:id", trial.Update)
			trials.DELETE("/:id", trial.Delete)
			trials.GET("/:id/events", event.List)
			trials.POST("/:id/events", event.Create)
		}

		events := v1.Group("/events")
		{
			events.GET("/:id", event.Get)
			events.PUT("/:id", event.Update)
			events.DELETE("/:id", event.Delete)
			events.POST("/:id/upload", event.Upload)
			events.GET("/:id/annotations", annotation.List)
			events.POST("/:id/annotations", annotation.Create)
		}

		annotations := v1.Group("/annotations")
		{
			annotations.PUT("/:id", annotation.Update)
			annotations.DELETE("/:id", annotation.Delete)
		}
	}

	return r
}
