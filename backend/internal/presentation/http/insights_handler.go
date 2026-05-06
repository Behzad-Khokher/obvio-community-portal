package http

import (
	"net/http"
	"strconv"

	"github.com/behzad/obvio/internal/usecase"
	"github.com/gin-gonic/gin"
)

type InsightsHandler struct {
	uc *usecase.InsightsUsecase
}

func NewInsightsHandler(uc *usecase.InsightsUsecase) *InsightsHandler {
	return &InsightsHandler{uc: uc}
}

// @Summary Get insights for a portal
// @Tags insights
// @Produce json
// @Param id path int true "Portal ID"
// @Success 200 {object} usecase.InsightsResult
// @Router /portals/{id}/insights [get]
func (h *InsightsHandler) Get(c *gin.Context) {
	portalID, _ := strconv.Atoi(c.Param("id"))
	result, err := h.uc.GetInsights(uint(portalID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
