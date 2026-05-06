package http

import (
	"net/http"
	"strconv"

	"github.com/behzad/obvio/internal/domain/trial"
	"github.com/behzad/obvio/internal/usecase"
	"github.com/gin-gonic/gin"
)

type TrialHandler struct {
	uc *usecase.TrialUsecase
}

func NewTrialHandler(uc *usecase.TrialUsecase) *TrialHandler {
	return &TrialHandler{uc: uc}
}

// @Summary List trials for a portal
// @Tags trials
// @Produce json
// @Param id path int true "Portal ID"
// @Success 200 {array} trial.Trial
// @Router /portals/{id}/trials [get]
func (h *TrialHandler) List(c *gin.Context) {
	portalID, _ := strconv.Atoi(c.Param("id"))
	trials, err := h.uc.ListTrials(uint(portalID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, trials)
}

// @Summary Get trial by ID
// @Tags trials
// @Produce json
// @Param id path int true "Trial ID"
// @Success 200 {object} trial.Trial
// @Router /trials/{id} [get]
func (h *TrialHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	t, err := h.uc.GetTrial(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "trial not found"})
		return
	}
	c.JSON(http.StatusOK, t)
}

// @Summary Create a trial for a portal
// @Tags trials
// @Accept json
// @Produce json
// @Param id path int true "Portal ID"
// @Param trial body trial.Trial true "Trial data"
// @Success 201 {object} trial.Trial
// @Router /portals/{id}/trials [post]
func (h *TrialHandler) Create(c *gin.Context) {
	portalID, _ := strconv.Atoi(c.Param("id"))
	var t trial.Trial
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t.PortalID = uint(portalID)
	if err := h.uc.CreateTrial(&t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, t)
}

// @Summary Update a trial
// @Tags trials
// @Accept json
// @Produce json
// @Param id path int true "Trial ID"
// @Param trial body trial.Trial true "Trial data"
// @Success 200 {object} trial.Trial
// @Router /trials/{id} [put]
func (h *TrialHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input trial.Trial
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.uc.UpdateTrial(uint(id), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// @Summary Delete a trial
// @Tags trials
// @Param id path int true "Trial ID"
// @Success 204
// @Router /trials/{id} [delete]
func (h *TrialHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.uc.DeleteTrial(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
