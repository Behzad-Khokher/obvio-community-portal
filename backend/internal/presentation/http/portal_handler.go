package http

import (
	"net/http"
	"strconv"

	"github.com/behzad/obvio/internal/domain/portal"
	"github.com/behzad/obvio/internal/usecase"
	"github.com/gin-gonic/gin"
)

type PortalHandler struct {
	uc *usecase.PortalUsecase
}

func NewPortalHandler(uc *usecase.PortalUsecase) *PortalHandler {
	return &PortalHandler{uc: uc}
}

// @Summary List all portals
// @Tags portals
// @Produce json
// @Success 200 {array} portal.Portal
// @Router /portals [get]
func (h *PortalHandler) List(c *gin.Context) {
	portals, err := h.uc.ListPortals()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, portals)
}

// @Summary Get portal by ID
// @Tags portals
// @Produce json
// @Param id path int true "Portal ID"
// @Success 200 {object} portal.Portal
// @Router /portals/{id} [get]
func (h *PortalHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	p, err := h.uc.GetPortal(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "portal not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// @Summary Create a portal
// @Tags portals
// @Accept json
// @Produce json
// @Param portal body portal.Portal true "Portal data"
// @Success 201 {object} portal.Portal
// @Router /portals [post]
func (h *PortalHandler) Create(c *gin.Context) {
	var p portal.Portal
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.uc.CreatePortal(&p); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

// @Summary Update a portal
// @Tags portals
// @Accept json
// @Produce json
// @Param id path int true "Portal ID"
// @Param portal body portal.Portal true "Portal data"
// @Success 200 {object} portal.Portal
// @Router /portals/{id} [put]
func (h *PortalHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input portal.Portal
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.uc.UpdatePortal(uint(id), &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// @Summary Delete a portal
// @Tags portals
// @Param id path int true "Portal ID"
// @Success 204
// @Router /portals/{id} [delete]
func (h *PortalHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.uc.DeletePortal(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
